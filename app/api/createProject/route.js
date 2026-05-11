import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import Fs from 'fs';
import path from 'path';
import { MongoClient, GridFSBucket } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
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
    bodyParser: false, // Disabling the body parser to handle multipart form data
  },
};

// Function to compute hash (MD5 or SHA256) for any string
function computeHash(input) {
  return crypto.createHash('md5').update(input).digest('hex');
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

// Validate upload completion
async function validateUpload(bucket, fileId) {
  const file = await bucket.find({ _id: fileId }).toArray();
  if (!file || file.length === 0) {
    throw new Error('File not found or upload incomplete.');
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const projectName = formData.get('projectName');
    const robotModel = formData.get('robotModel'); // Selected robot model ID
    const robotName = formData.get('robotName'); // Selected robot model name

    const projectId = uuidv4();
    const creationDate = new Date();
    const updatedDate = creationDate; // Initial update date is the same as the creation date

    const db = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'Program_Files' }); // Bucket for program files

    // Create project directory
    const projectDir = path.join(process.cwd(), projectName);
    if (!Fs.existsSync(projectDir)) {
      await fs.mkdir(projectDir, { recursive: true });
    }


    // Calculate hash for the main.rprg file
    const mainRprgBuffer = Buffer.from('//This is the Main Program.');
    const mainRprgHash = computeHash(mainRprgBuffer.toString());

    // Check if the file already exists
    const fileAlreadyExists = await fileExists(bucket, 'main.rprg', mainRprgHash);
    if (fileAlreadyExists) {
      throw new Error('File with the same name or hash already exists.');
    }

    // Create an empty main.rprg file
    const mainRprgFilePath = path.join(projectDir, 'programs', 'main.rprg');
    await fs.mkdir(path.dirname(mainRprgFilePath), { recursive: true });
    await fs.writeFile(mainRprgFilePath, '//This is the Main Program.'); // Create empty main.rprg file

    // Upload the main.rprg file to the bucket
    const uploadStream = bucket.openUploadStream('main.rprg', {
      metadata: {
        projectName,
        creationDate,
        hash: mainRprgHash,
      },
    });
    Fs.createReadStream(mainRprgFilePath).pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    // Validate the upload
    await validateUpload(bucket, uploadStream.id);

    // Project files metadata to be included in .rbst
    const projectFiles = [
      {
        name: 'main.rprg',
        id: uploadStream.id,
        hash: mainRprgHash,
      },
    ];

    // Prepare JSON data for the .rbst file
    const rbstData = {
      projectId,
      projectName,
      creationDate: creationDate.toISOString(),
      robotName,
      robotId: robotModel,
      updatedDate: updatedDate.toISOString(),
      programFiles: projectFiles,
      overallProjectHash: computeHash(JSON.stringify({ projectId, projectName, creationDate, robotName, robotModel, updatedDate, programFiles: projectFiles }))
    };

    // Create the project metadata file (.rbst) in JSON format
    const rbstFilePath = path.join(projectDir, `${projectName}_${projectId}.rbst`);
    await fs.writeFile(rbstFilePath, JSON.stringify(rbstData, null, 2)); // Write JSON data

    // Insert a new project document into the Projects collection
    await db.collection('Projects').insertOne({
      projectId,
      projectName,
      creationDate,
      robotName,
      robotId: robotModel,
      updatedDate,
      overallHash: rbstData.overallProjectHash, // Include overall hash
      programFiles: projectFiles, // Store program file details
    });

    // Update Robot_Model_Metadata to include this project
    await db.collection('Robot_Models_Metadata').updateOne(
      { robotName },
      { $addToSet: { projects: projectName } } // Use $addToSet to avoid duplicates
    );

    return NextResponse.json({ message: 'Project created successfully', projectId });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
