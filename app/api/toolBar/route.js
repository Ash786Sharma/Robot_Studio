//app/api/toolBar/route.js
import fs from 'fs';
import path from 'path';

export const GET = async (req, res) => {
  try {
    const filePath = path.resolve(process.cwd(), 'public', 'toolData.json');
    console.log(filePath);
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return new Response(JSON.stringify(jsonData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error reading toolBar.json:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
