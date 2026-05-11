import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

const mongoUri = 'mongodb://localhost:27017';
const dbName = 'Robot_Studio';

// Reusable function to connect to MongoDB
async function connectToDatabase() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return client.db(dbName);
}

// API to fetch all available robot models
export async function GET() {
  try {
    const db = await connectToDatabase();
    const projectsCollection = db.collection('Projects');

    // Fetch all robot model metadata
    const projects = await projectsCollection.find().toArray();
    //console.log(projects);
    

    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch Projects:', error);
    return NextResponse.json({ error: 'Failed to fetch Projects' }, { status: 500 });
  }
}
