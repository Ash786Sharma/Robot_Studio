//app/api/createProject/route.js
import fs from 'fs';
import path from 'path';
const convert = require('xml-js');

// Utility function to parse XML to JSON
const parseXml = async (xml) => {
  const parsexml = new convert.xml2js(xml, {compact: true, spaces: 4});
  return parsexml
};


// Example usage in your GET function
export const GET = async (req, res) => {
    try {
      const filePath = path.resolve(process.cwd(), 'public\\urdf_ur3', 'ur3.urdf');
  
      // Convert XML to JSON
      const urdfJson = await parseXml(fs.readFileSync(filePath, 'utf8'));
  
      // Extract kinematic chain
      const kinematicChain = extractKinematicChain(urdfJson);
      //console.log(kinematicChain[0]);
      const transformdata = transformAttributes(kinematicChain)
      //console.log(transformdata);
      const treeData = buildTree(transformdata);

      return new Response(JSON.stringify(treeData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
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
  
