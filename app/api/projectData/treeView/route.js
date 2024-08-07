//app/api/toolBar/route.js
import fs from 'fs';
import path from 'path';
const convert = require('xml-js');

// Utility function to parse XML to JSON
const parseXml = async (xml) => {
  const parsexml = new convert.xml2js(xml, {compact: true, spaces: 4});
  return parsexml
};

const extractKinematicChain = (json) => {
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
    
    // Function to build the hierarchical chain
    const buildChain = () => {
      const chain = [];
      const processedJoints = new Set();
    
      // Helper function to recursively add joints and links to the chain
      const addLinkAndJoints = (linkName) => {
        const link = kinematicChain.links.find(l => l.name === linkName);
        if (link) {
          chain.push(link);
    
          const connectingJoints = kinematicChain.joints.filter(
            joint => !processedJoints.has(joint.name) && (joint.parent === linkName || joint.child === linkName)
          );
    
          connectingJoints.forEach(joint => {
            if (!processedJoints.has(joint.name)) {
              chain.push(joint);
              processedJoints.add(joint.name);
              if (joint.parent === linkName) {
                addLinkAndJoints(joint.child);
              } else {
                addLinkAndJoints(joint.parent);
              }
            }
          });
        }
      };
    
      // Start with the root link (assuming it's the first link in the list)
      if (kinematicChain.joints.length > 0) {
        addLinkAndJoints(kinematicChain.joints[0].parent);
      }
    
      return chain;
    };
    
    //console.log(kinematicChain.links);
    //console.log(kinematicChain.joints);
    return buildChain();
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


    const buildTree = (kinematicChain) => {
        const linksMap = new Map();
        const jointsMap = new Map();
    
        // Create a map of all links and joints
        kinematicChain.forEach(item => {
            if (item.visual || item.inertial || item.collision) {
                linksMap.set(item.name, { id: `link_${item.name}`, label: item.name, children: [] });
            } else if (item.parent && item.child) {
                jointsMap.set(item.name, { id: `joint_${item.name}`, label: item.name, children: [] });
            }
        });
    
        // Link parents and children in the tree structure
        kinematicChain.forEach(item => {
            if (item.parent && item.child) {
                const parentLink = linksMap.get(item.parent);
                const childLink = linksMap.get(item.child);
                const joint = jointsMap.get(item.name);
    
                if (parentLink && childLink && joint) {
                    parentLink.children.push(joint);
                    joint.children.push(childLink);
                }
            }
        });
    
        // Find the root link (those without a parent joint)
        const rootLink = kinematicChain.find(
            item => item.visual && !kinematicChain.some(joint => joint.child === item.name)
        );
    
        const tree = rootLink ? [linksMap.get(rootLink.name)] : [];
    
        // Debugging: Log the final tree structure
        //console.log("Final Tree Structure:", JSON.stringify(tree, null, 2));
    
        return tree;
    }
    
   
  
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
  
