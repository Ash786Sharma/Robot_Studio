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
    const modelsCollection = db.collection('Robot_Models_Metadata');

    // Fetch all robot model metadata
    const models = await modelsCollection.find().toArray();

    return NextResponse.json(models, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch robot models:', error);
    return NextResponse.json({ error: 'Failed to fetch robot models' }, { status: 500 });
  }
}
