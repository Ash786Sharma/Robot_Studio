//app/api/menuBar/route.js
import fs from 'fs';
import path from 'path';

export const GET = async (req, res) => {
  try {
    const filePath = path.resolve(process.cwd(), 'public', 'menuData.json');
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return new Response(JSON.stringify(jsonData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error reading menuBar.json:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
