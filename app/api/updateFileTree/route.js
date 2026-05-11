import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const projectDir = `${process.cwd()}/`;

export async function POST(req, res) {
  const { fileStructure } = await req.json();
  try {
    if (!fileStructure || fileStructure.length === 0) {
      return NextResponse.json(
        { error: "Invalid file structure" },
        { status: 400 }
      );
    }

    const projectName = fileStructure[0].name;
    //console.log(projectName);

    const rootPath = path.join(projectDir, projectName);
    //console.log(rootPath);

    const syncFolder = async (items) => {
      //console.log("sync file & folders");

      for (const item of items) {
        if (item.type === "folder") {
          try {
            await fs.access(item.path);
          } catch (e) {
            await fs.mkdir(item.path, { recursive: true });
            //console.log(`Created folder: ${item.path}`);
          }
          if (item.children) {
            await syncFolder(item.children);
          }
        } else if (item.type === "file") {
          try {
            await fs.access(item.path);
          } catch (e) {
            await fs.writeFile(item.path, "");
            console.log(`Created file: ${item.path}`);
          }
        }
      }
    };

    const deleteExtraFiles = async (items, currentPath) => {
      //console.log("deleting the file and folder");

      const existingFiles = await fs.readdir(currentPath);
      for (const file of existingFiles) {
        const filePath = path.join(currentPath, file);
        const itemExists = items.some((item) => {
          return path.join(currentPath, item.name) === filePath;
        });
        if (!itemExists) {
          try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
              await deleteExtraFiles([], filePath);
              await fs.rmdir(filePath);
              //console.log(`Deleted folder: ${filePath}`);
            } else {
              await fs.unlink(filePath);
              //console.log(`Deleted file: ${filePath}`);
            }
          } catch (deleteError) {
            console.error(`Error deleting ${filePath}:`, deleteError);
          }
        } else {
          const item = items.find(
            (item) => path.join(currentPath, item.name) === filePath
          );
          if (item && item.children) {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
              await deleteExtraFiles(item.children, filePath);
            }
          }
        }
      }
    };

    try {
      await fs.access(rootPath);
    } catch (e) {
      await fs.mkdir(rootPath, { recursive: true });
      //console.log(`Created project root: ${rootPath}`);
    }

    await syncFolder(fileStructure);
    await deleteExtraFiles(fileStructure[0].children || [], rootPath);

    return NextResponse.json(
      { message: "file structure updated", fileStructure },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating file tree:", error);

    return NextResponse.json(
      { error: "Error updating file tree:" },
      { status: 500 }
    );
  }
}
