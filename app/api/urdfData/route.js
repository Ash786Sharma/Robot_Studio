//app/api/urdfData/route.js
import fs from 'fs';
import path from 'path';
const convert = require('xml-js');

// Utility function to parse XML to JSON
const parseXml = async (xml) => {
  return xml
};

  
  // Example usage in your GET function
  export const GET = async (req, res) => {
    try {
      const filePath = path.resolve(process.cwd(), 'public\\urdf', 'ur3.urdf');
  
      // Convert XML to JSON
      const urdfxml = await parseXml(fs.readFileSync(filePath, 'utf8'));
  
      return new Response(urdfxml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      });
    } catch (error) {
      console.error('Error processing URDF:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to process URDF' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
  
