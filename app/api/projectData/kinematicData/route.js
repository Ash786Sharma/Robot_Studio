//app/api/toolBar/route.js
import fs from 'fs';
import path from 'path';
const convert = require('xml-js');

// Utility function to parse XML to JSON
const parseXml = async (xml) => {
  const parsexml = new convert.xml2js(xml, {compact: true, spaces: 4});
  return parsexml
};

const extractKinematicChainData = (json) => {
    const kinematicChain = {
    links: [],
    joints: []
    };
    const processLink = (link) => {
      const { name } = link._attributes;
      const visual = link.visual ? link.visual : null;
      const inertial = link.inertial ? link.inertial : null;
      const collision = link.collision ? link.collision : null;
      const existingLink = kinematicChain.links.find(l => l.name === name);
      if (!existingLink) {
        kinematicChain.links.push({ name, visual, inertial, collision });
      }
    };
    
    const processJoint = (joint) => {
      const { name, type } = joint._attributes;
      const parent = joint.parent._attributes.link;
      const child = joint.child._attributes.link;
      const origin = joint.origin ? joint.origin._attributes : null;
      const axis = joint.axis ? joint.axis._attributes : null;
      const limit = joint.limit ? joint.limit._attributes : null;
    
      const existingJoint = kinematicChain.joints.find(j => j.name === name);
      if (!existingJoint) {
        kinematicChain.joints.push({ name, parent, child, type, origin, axis, limit });
      }
    };
    
    if (json.robot && json.robot.link) {
      const links = Array.isArray(json.robot.link) ? json.robot.link : [json.robot.link];
      links.forEach(processLink);
    }
    
    if (json.robot && json.robot.joint) {
      const joints = Array.isArray(json.robot.joint) ? json.robot.joint : [json.robot.joint];
      joints.forEach(processJoint);
    }
    
    return (kinematicChain);
    };

    const transformAttributes = (obj)=> {
        if (Array.isArray(obj)) {
            return obj.map(transformAttributes);
        } else if (typeof obj === 'object' && obj !== null) {
            const newObj = {};
            for (const key in obj) {
                if (key === '_attributes') {
                    Object.assign(newObj, transformAttributes(obj[key]));
                } else {
                    newObj[key] = transformAttributes(obj[key]);
                }
            }
            return newObj;
        } else {
            return obj;
        }
    }
  
   
  
  // Example usage in your GET function
  export const GET = async (req, res) => {
    try {
      const filePath = path.resolve(process.cwd(), 'public\\urdf_ur3', 'ur3.urdf');
  
      // Convert XML to JSON
      const urdfJson = await parseXml(fs.readFileSync(filePath, 'utf8'));
  
      // Extract kinematic chain
      const kinematicChainData = extractKinematicChainData(urdfJson);
      
      const transformdata = transformAttributes(kinematicChainData)
      //console.log(transformdata);

      return new Response(JSON.stringify(transformdata), {
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
  
