// app/api/getProjectMetadata/route.js

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

// Utility function to check if a string is a valid ObjectId
const isValidObjectId = (id) => {
    return ObjectId.isValid(id) && id.length === 24;  // Length check for 24-char hex string
  };

const getProjectMetadata = async (db, projectId) => {
    let project;
  
    if (isValidObjectId(projectId)) {
      // If it's a valid ObjectId, query by _id
      project = await db.collection('Projects').findOne({ _id: new ObjectId(projectId) });
    } else {
      // If it's a UUID, query by projectId
      project = await db.collection('Projects').findOne({ projectId });
    }
  
   // Check if the project exists 
    if (!project) {
        console.warn('Project not found for projectId:', projectId);
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
  
    return project;
  };

// API to fetch specific project metadata by dynamic projectId
export async function POST (req, res) {
  try {
    const { projectId, projectData } = await req.json(); // Extract projectId from the dynamic route
    //console.log('Fetching project metadata:', projectId, projectData);
    
    // Validate projectId
    if (!projectId && !projectData) {
      console.error('projectId or projectData is required but was not provided.');
      return NextResponse.json({ error: 'projectId or projectData is required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    //console.log('Connected to MongoDB');

    const projectsCollection = db.collection('Projects');
    const modelsCollection = db.collection('Robot_Models_Metadata');
    let project;
    // Fetch the project metadata based on the projectId
    if(projectId && !projectData){
      project = await getProjectMetadata(db, projectId);  // Fetch project metadata
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      //console.log('Project:', project); 
    }else{
      project = projectData
      //console.log('Project:', project);
    }

    if (!project || !project.robotId) {
      console.warn('Project or robotId not found:', projectId);
      return NextResponse.json({ error: 'Project or robotId not found' }, { status: 404 });
    }
    // Fetch the metadata for the specific robot model by ID
    const model = await modelsCollection.findOne({ _id: new ObjectId(project.robotId) });

    // Check if the model exists 
    if (!model) {
      console.warn('Robot model not found for modelId:', project.robotId);
      return NextResponse.json({ error: 'Robot model not found' }, { status: 404 });
    }

    const robotBucket = new GridFSBucket(db,{ bucketName: 'Robot_Models' });

    // If there's an imageId in the model, fetch the image from GridFS
    let imageUrl = null;
    if (model.robotImageId) {
      const downloadStream = robotBucket.openDownloadStream(new ObjectId(model.robotImageId));

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

    const response = {
        ...project,   // This includes all the existing project metadata (projectId, projectName, programFiles, etc.)
        imageUrl,     // Add the image URL for the robot's preview
      };

    // Include the imageUrl in the returned model
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch project metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch project metadata' }, { status: 500 });
  }
}
