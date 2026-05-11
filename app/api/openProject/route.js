import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import Fs from 'fs';
import path from 'path';
import { MongoClient, GridFSBucket } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const mongoUri = 'mongodb://localhost:27017';
const dbName = 'Robot_Studio';
const projectsDir = `${process.cwd()}/`; // Update with the actual path

async function connectToDatabase() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return client.db(dbName);
}

// Helper function to compute hash (MD5 or SHA256)
function computeHash(input) {
  return crypto.createHash('md5').update(input).digest('hex');
}


async function writeFileFromStream(downloadStream, filePath) {
  const writeStream = Fs.createWriteStream(filePath);
  downloadStream.pipe(writeStream);
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

async function uploadFileToGridFS( uploadStream, filePath) {
  const fileStream = Fs.createReadStream(filePath);
  fileStream.pipe(uploadStream);
  await new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
  });
}

async function moveFile(source, destination) {
  await fs.rename(source, destination);
}

// Function to check if project exists locally
async function checkLocalProject(projectName) {
  const projectPath = path.join(projectsDir, projectName);
  try {
    await fs.access(projectPath);
    return true; // Project exists
  } catch (err) {
    return false; // Project doesn't exist
  }
}

// Function to create local project directories and files based on database reference
async function createLocalProject(bucket, projectData) {
  const projectPath = path.join(projectsDir, projectData.projectName);
  await fs.mkdir(path.join(projectPath, 'program'), { recursive: true });

  const rbstFilePath = path.join(projectPath, `${projectData.projectName}_${projectData.projectId}.rbst`);
  await fs.writeFile(rbstFilePath, JSON.stringify(projectData, null, 2));

  for (const file of projectData.programFiles) {
    const programFilePath = path.join(projectPath, 'program', file.name);

    const files = await bucket.find({ filename: file.name }).toArray();
    if (files.length === 0) {
      console.warn(`File not found in GridFS: ${file.name}`);
      continue;
    }
    // Download file from GridFS and write to local storage
    const downloadStream = bucket.openDownloadStreamByName(file.name);
    await writeFileFromStream(downloadStream, programFilePath);
    
    console.log(`Downloaded file: ${file.name} -> ${programFilePath}`);
  }
  console.log(`Local project created successfully at ${projectPath}`);
}

// API handler for opening a project
export async function POST(req, res) {
  const { projectId, projectName, tabType } = await req.json();
   // tabType indicates whether it's a local or database project
  console.log('Opening project:', projectId, tabType);
  
  const db = await connectToDatabase();
  const projectsCollection = db.collection('Projects');
  const bucket = new GridFSBucket(db, { bucketName: 'Program_Files' });

  let projectData;
  
  // Step 1: Handle Database Project Opening
  if (tabType === 'database') {
    projectData = await projectsCollection.findOne({ projectId });
    
    if (!projectData) {
      return NextResponse.json({ message: 'Project not found in database' }, { status: 404 });
    }

    // Check if the project exists locally
    const localExists = await checkLocalProject(projectData.projectName);

    // If local files don't exist, create them
    if (!localExists) {
      await createLocalProject(bucket, projectData);
    }

    // Set session or cookie for opened project
    const response = NextResponse.json({ message: 'Project opened successfully', projectData }, { status: 200 });
    response.cookies.set('openProject', JSON.stringify({ projectName }));
    return response;
  }

  // Step 2: Handle Local Project Opening
  if (tabType === 'local') {
    const projectPath = path.join(projectsDir, projectName);
    const rbstFilePath = path.join(projectPath, `${projectName}_${projectId}.rbst`);
    //console.log('Opening local project:', rbstFilePath);
    
    const misplacedRbstFilePath = path.join(projectsDir, `${projectName}_${projectId}.rbst`);

    const creationDate = new Date();

    // Ensure project directory exists
    if (!(await checkLocalProject(projectName))) {
      await fs.mkdir(path.join(projectPath, 'program'), { recursive: true });

      // If .rbst file is misplaced in projectsDir, move it into the new directory
      if (await checkLocalProject(`${projectName}_${projectId}.rbst`)) {
        await moveFile(misplacedRbstFilePath, rbstFilePath);
      }
    } else {
      if (!(await checkLocalProject(path.join(projectName, `program`)))) {
        await fs.mkdir(path.join(projectPath, 'program'), { recursive: true });
      }
    }

    // Check if .rbst file exists
    //if (!(await checkLocalProject(`${projectPath}/${projectName}_${projectId}.rbst`))) {
    //return NextResponse.json({ message: 'Local project .rbst file not found' }, { status: 404 });
    //}

    // Read the local .rbst file to get project details
    const fileContent = await fs.readFile(rbstFilePath, 'utf-8');
    projectData = JSON.parse(fileContent);

    // Check if the project exists in the database
    const dbProject = await projectsCollection.findOne({ projectId });
    // If the project doesn't exist in the database, create it
    if (!dbProject) {
      await projectsCollection.insertOne({ ...projectData, projectId });
    }
    // Sync missing files from the database to local
    for (const file of projectData.programFiles) {
      console.log("file: ",file);
      const programFilePath = path.join(projectPath, 'program', file.name);
      console.log("progFilePath: ",programFilePath);
      const localFileExists = await checkLocalProject(path.join(projectName, 'program', file.name));
      console.log("localFileExists: ", localFileExists);
      
      if (!localFileExists) {
        console.log('DOWNLOADING FILE');
        const files = await bucket.find({ filename: file.name }).toArray();
        if (files.length > 0) {
          const downloadStream = bucket.openDownloadStreamByName(file.name);
          await writeFileFromStream(downloadStream, programFilePath);
        }
      }
      
      const fileExistsInDB = await bucket.find({ filename: file.name }).toArray();
      if (localFileExists && fileExistsInDB.length === 0) {
        console.log('UPLOADING FILE');
        console.log("Upload: ",localFileExists, fileExistsInDB);
        const uploadStream = bucket.openUploadStream(file.name, {
          metadata: {
            projectName : projectData.projectName,
            creationDate,
            hash: file.hash,
          },
        });
        await uploadFileToGridFS(uploadStream, programFilePath);
      }

    }
    // Set session or cookie for the opened project
    const response = NextResponse.json({ message: 'Local project opened successfully', projectData }, { status: 200 });
    response.cookies.set('openProject', JSON.stringify({ projectName }));
    return response;
  } else {
      return NextResponse.json({ message: 'Local project not found' }, { status: 404 });
  }
}
