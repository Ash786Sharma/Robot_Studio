// app/api/files/route.js
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid"; // Import the uuid function

const projectDir = `${process.cwd()}/`;

const getFileStructure = async (dirPath, isRoot = true) => {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  const fileStructure = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dirPath, file.name);
      const stats = await fs.stat(fullPath);

      return {
        id: uuidv4(),
        name: file.name,
        type: file.isDirectory() ? "folder" : "file",
        path: fullPath,
        size: stats.size,
        children: file.isDirectory()
          ? await getFileStructure(fullPath, false)
          : []
      };
    })
  );

  // Only wrap with parent folder on the initial (root) call
  if (isRoot) {
    return [
      {
        id: uuidv4(),
        name: path.basename(dirPath),
        type: "folder",
        path: dirPath,
        size: 0,
        children: fileStructure
      }
    ];
  }

  return fileStructure;
};

// Function to check if project exists locally
async function checkLocalProject(projectName) {
  const projectPath = path.join(projectDir, projectName);
  try {
    await fs.access(projectPath);
    return true; // Project exists
  } catch (err) {
    return false; // Project doesn't exist
  }
}

export async function POST(req, res) {
  const { projectName } = await req.json();
  try {
    console.log(projectName);

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create project directory
    const projectStructure = path.join(projectDir, `${projectName}`);
    console.log("Path", projectStructure);
    const projectExists = await checkLocalProject(projectName);
    console.log("project exists", projectExists);

    let fileStructure;
    if (projectExists) {
      fileStructure = await getFileStructure(projectStructure); // Change this to your root directory
      //console.log(...fileStructure);
    }

    return NextResponse.json(
      { message: "file structure", fileStructure },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "file structure not found" },
      { status: 500 }
    );
  }
}
