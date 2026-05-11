import { promises as fs } from 'fs';
import path from 'path';

const baseDir = path.resolve(process.cwd()); // Adjust this to your base project directory

// Utility to get the full path based on the given path
const getFullPath = (relativePath) => path.join(baseDir, relativePath);

// POST (Create Directory or File)
export async function POST(req) {
  const { name, type, parentPath = '' } = await req.json(); // `parentPath` is optional
  const fullPath = getFullPath(path.join(parentPath, name));

  try {
    if (type === 'directory') {
      await fs.mkdir(fullPath); // Create directory
      return new Response(JSON.stringify({ message: `Directory "${name}" created successfully.`, path: fullPath }), {
        status: 201,
      });
    } else if (type === 'file') {
      await fs.writeFile(fullPath, ''); // Create empty file
      return new Response(JSON.stringify({ message: `File "${name}" created successfully.`, path: fullPath }), {
        status: 201,
      });
    } else {
      return new Response(JSON.stringify({ message: 'Invalid type specified. Use "file" or "directory".' }), {
        status: 400,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: `Error: ${error.message}` }), {
      status: 500,
    });
  }
}

// DELETE (Delete Directory or File)
export async function DELETE(req) {
  const { name, type, parentPath = '' } = await req.json();
  const fullPath = getFullPath(path.join(parentPath, name));

  try {
    const stat = await fs.lstat(fullPath);
    if (stat.isDirectory()) {
      await fs.rmdir(fullPath); // Delete directory
    } else {
      await fs.unlink(fullPath); // Delete file
    }
    return new Response(JSON.stringify({ message: `${type === 'directory' ? 'Directory' : 'File'} "${name}" deleted successfully.`, path: fullPath }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: `File or directory "${name}" not found.`, path: fullPath }), {
      status: 404,
    });
  }
}

// PATCH (Rename Directory or File)
export async function PATCH(req) {
  const { name, newName, type, parentPath = '' } = await req.json();
  const fullPath = getFullPath(path.join(parentPath, name));
  const newFullPath = getFullPath(path.join(parentPath, newName));

  try {
    await fs.rename(fullPath, newFullPath); // Rename directory or file
    return new Response(JSON.stringify({ message: `${type === 'directory' ? 'Directory' : 'File'} renamed from "${name}" to "${newName}".`, path: newFullPath }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: `File or directory "${name}" not found.`, path: fullPath }), {
      status: 404,
    });
  }
}

// PUT (Save/Update File Content)
export async function PUT(req) {
  const { name, content, parentPath = '' } = await req.json();
  const fullPath = getFullPath(path.join(parentPath, name));

  try {
    await fs.writeFile(fullPath, content); // Save updated content to file
    return new Response(JSON.stringify({ message: `File "${name}" saved successfully.`, path: fullPath }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: `Error: ${error.message}`, path: fullPath }), {
      status: 500,
    });
  }
}
