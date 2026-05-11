// app/api/getRobotModelMetadata/[modelId]/route.js

import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import { NextResponse } from 'next/server';

const mongoUri = 'mongodb://localhost:27017';
const dbName = 'Robot_Studio';

// Reusable function to connect to MongoDB
async function connectToDatabase() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return client.db(dbName);
}

// Helper function to fetch files from GridFS using file IDs
async function getFilesByIds(bucket, fileIds) {
  const files = [];
  //console.log(fileIds);
  
  for (const fileId of fileIds) {
    const fileInfo = await bucket.find({_id: fileId}).toArray();
    
    files.push(fileInfo[0].filename); // Add the file name to the list
  }
  //console.log(files);
  

  return files;
}

// API to fetch specific robot model metadata by dynamic modelId
export async function GET(req, { params }) {
  try {
    const { modelId } = params; // Extract modelId from the dynamic route

    // Log the received modelId
    //console.log('Received modelId:', modelId);

    // Validate modelId
    if (!modelId) {
      console.error('modelId is required but was not provided.');
      return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    //console.log('Connected to MongoDB');

    const modelsCollection = db.collection('Robot_Models_Metadata');

    // Fetch the metadata for the specific robot model by ID
    const model = await modelsCollection.findOne({ _id: new ObjectId(modelId) });

    // Log the retrieved model
    //console.log('Retrieved model:', model);

    // Check if the model exists 
    if (!model) {
      console.warn('Robot model not found for modelId:', modelId);
      return NextResponse.json({ error: 'Robot model not found' }, { status: 404 });
    }

    const bucket = new GridFSBucket(db,{ bucketName: 'Robot_Models' });

    const robotFilesNames = await getFilesByIds(bucket, model.robotFilesId)
    const imageinfo = await bucket.find({_id: model.robotImageId}).toArray();
    const imageName = imageinfo[0].filename
    

    // If there's an imageId in the model, fetch the image from GridFS
    let imageUrl = null;
    if (model.robotImageId) {

      
      
      const downloadStream = bucket.openDownloadStream(new ObjectId(model.robotImageId));

      // Create a promise to get the image data
      imageUrl = new Promise((resolve, reject) => {
        const chunks = [];
        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('end', () => {
          // Convert the image data to a base64 string
          const buffer = Buffer.concat(chunks);
          const base64Image = buffer.toString('base64');
          resolve(`data:image/jpeg;base64,${base64Image}`); // Adjust the MIME type if necessary
        });
        downloadStream.on('error', (error) => {
          console.error('Error retrieving image:', error);
          reject(error);
        });
      });
    }

    // Wait for the imageUrl promise to resolve
    imageUrl = await imageUrl;

    // Include the imageUrl in the returned model
    return NextResponse.json({ ...model, imageUrl, imageName, robotFilesNames }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch robot model metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch robot model metadata' }, { status: 500 });
  }
}


// DELETE API to delete specific robot model metadata and associated files by dynamic modelId
export async function DELETE(req, { params }) {
  try {
    const { modelId } = params; // Extract modelId from the dynamic route

    // Log the received modelId
    //console.log('Received modelId:', modelId);

    // Validate modelId
    if (!modelId) {
      console.error('modelId is required but was not provided.');
      return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    //console.log('Connected to MongoDB');

    const modelsCollection = db.collection('Robot_Models_Metadata');

    // Fetch the metadata for the specific robot model by ID
    const model = await modelsCollection.findOne({ _id: new ObjectId(modelId) });

    // Log the retrieved model
    //console.log('Retrieved model:', model);

    // Check if the model exists 
    if (!model) {
      console.warn('Robot model not found for modelId:', modelId);
      return NextResponse.json({ error: 'Robot model not found' }, { status: 404 });
    }

    const bucket = new GridFSBucket(db, { bucketName: 'Robot_Models' });

    // Delete associated robot files from GridFS
    for (const fileId of model.robotFilesId) {
      try {
        await bucket.delete(new ObjectId(fileId)); // Delete each file
      } catch (error) {
        console.error(`Failed to delete robot file with ID ${fileId}:`, error);
      }
    }

    // Delete associated robot image from GridFS if exists
    if (model.robotImageId) {
      try {
        await bucket.delete(new ObjectId(model.robotImageId)); // Delete the image
      } catch (error) {
        console.error(`Failed to delete robot image with ID ${model.robotImageId}:`, error);
      }
    }

    // Delete the metadata from the Robot_Models_Metadata collection
    await modelsCollection.deleteOne({ _id: new ObjectId(modelId) });

    // Return a success response
    return NextResponse.json({ message: 'Robot model and associated files deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete robot model metadata and files:', error);
    return NextResponse.json({ error: 'Failed to delete robot model metadata and files' }, { status: 500 });
  }
}
