import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import Fs from 'fs';
import path from 'path';
import { MongoClient, GridFSBucket } from 'mongodb';
import crypto from 'crypto';

const mongoUri = 'mongodb://localhost:27017';
const dbName = 'Robot_Studio';

async function connectToDatabase() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return client.db(dbName);
}

export const config = {
  api: {
    bodyParser: false, // Disabling body parser for multipart form data
  },
};

// Function to compute file hash
function computeFileHash(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// Check if a file with the same filename or hash exists
async function fileExists(bucket, filename, hash) {
  const existingFile = await bucket.find({
    $or: [
      { filename: filename },
      { 'metadata.hash': hash }
    ]
  }).toArray();

  return existingFile.length > 0;
}

// Function to clean up the upload directory and files
async function cleanupUploadDir(uploadDir) {
  try {
    // Delete all files in the directory
    const files = await fs.readdir(uploadDir);
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      await fs.unlink(filePath); // Delete each file
    }

    // Remove the upload directory itself
    await fs.rmdir(uploadDir);
    console.log('Upload directory and files cleaned up.');
  } catch (err) {
    console.error('Error cleaning up upload directory:', err);
  }
}

// Validate upload completion
async function validateUpload(bucket, fileId) {
  const file = await bucket.find({ _id: fileId }).toArray();
  if (!file || file.length === 0) {
    throw new Error('File not found or upload incomplete.');
  }

  //const chunks = await bucket.find({ files_id: fileId }).toArray();
}

// API to add or update a robot model
export async function POST(req) {
  try {
    const formData = await req.formData();
    
    const robotName = formData.get('robotName');
    const robotFiles = formData.getAll('robotFiles');  // Multiple files (URDF files)
    const robotImage = formData.get('robotImage');     // Single image file

    if (!robotName || !robotFiles.length || !robotImage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const creationDate = new Date();
    const db = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'Robot_Models' });

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!Fs.existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const fileIds = [];
    let newFilesUploaded = false;  // Flag to track if any new files are uploaded
    
    // Fetch existing metadata for the robot model
    const existingMetadata = await db.collection('Robot_Models_Metadata').findOne({ robotName });

    // If metadata exists, preserve the existing file IDs
    const existingFileIds = existingMetadata ? existingMetadata.robotFilesId : [];
    const existingImageId = existingMetadata ? existingMetadata.robotImageId : null;

    // Process each URDF file
    for (const file of robotFiles) {
      const filePath = path.join(uploadDir, file.name);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);

      const hash = computeFileHash(buffer);
      const fileAlreadyExists = await fileExists(bucket, file.name, hash);

      if (fileAlreadyExists) {
        console.log(`File ${file.name} already exists.`);
        continue;  // Skip to the next file
      }

      const uploadStream = bucket.openUploadStream(file.name, {
        metadata: { robotName, creationDate, hash },
      });
      Fs.createReadStream(filePath).pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve());
        uploadStream.on('error', (err) => reject(err));
      });

      await validateUpload(bucket, uploadStream.id);
      fileIds.push(uploadStream.id);  // Store each file ID in an array
      newFilesUploaded = true;  // Flag set to true if a new file is uploaded
    }

    // Process Robot Image
    const imageFilePath = path.join(uploadDir, robotImage.name);
    const imageBuffer = Buffer.from(await robotImage.arrayBuffer());
    await fs.writeFile(imageFilePath, imageBuffer);

    const imageHash = computeFileHash(imageBuffer);
    const imageAlreadyExists = await fileExists(bucket, robotImage.name, imageHash);

    let imageId = existingImageId;  // Default to existing image ID
    if (!imageAlreadyExists) {
      const imageUploadStream = bucket.openUploadStream(robotImage.name, {
        metadata: { robotName, creationDate, imageHash },
      });
      Fs.createReadStream(imageFilePath).pipe(imageUploadStream);

      await new Promise((resolve, reject) => {
        imageUploadStream.on('finish', () => resolve());
        imageUploadStream.on('error', (err) => reject(err));
      });

      await validateUpload(bucket, imageUploadStream.id);
      imageId = imageUploadStream.id;  // Update image ID with the new one
      newFilesUploaded = true;  // Flag set to true if a new image is uploaded
    }

    // If no new files or image were uploaded, return success without updating metadata
    if (!newFilesUploaded && existingMetadata) {
      return NextResponse.json({ message: 'Robot Model Already in Database No new files uploaded, robot model unchanged' }, { status: 200 });
    }

    // Merge new and existing file IDs for a complete list of files
    const completeFileIds = [...new Set([...existingFileIds, ...fileIds])];  // Remove duplicates with Set

    // Upsert (update or insert) metadata for the robot model
    await db.collection('Robot_Models_Metadata').updateOne(
      { robotName },
      {
        $set: {
          robotFilesId: completeFileIds,  // Use the merged list of file IDs
          robotImageId: imageId,  // Use the latest image ID
          creationDate,
          projects: [],  // Placeholder for projects using this model
        },
      },
      { upsert: true }  // Insert a new document if no metadata exists
    );

    // Cleanup the temporary upload directory
    await cleanupUploadDir(uploadDir);

    return NextResponse.json({ message: 'Robot model added/updated successfully', robotName }, { status: 200 });
  } catch (error) {
    console.error('Error adding/updating robot model:', error);

    // Cleanup the temporary upload directory
    await cleanupUploadDir(uploadDir);

    return NextResponse.json({ error: 'Failed to add/update robot model' }, { status: 500 });
  }
}
