'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Box, Divider, Typography, Button, Slider, Tabs, Tab, Switch, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Input, Grid } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { RichTreeView } from '@mui/x-tree-view';
import { AddBoxRounded, IndeterminateCheckBoxRounded, DisabledByDefaultRounded } from '@mui/icons-material';

const ProjectExplorer = ({ open, toggleDrawer, drawerName, zIndex }) => {
  const [treeData, setTreeData] = useState(null);
  const [kinematicData, setKinematicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('one');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [jointDialogOpen, setJointDialogOpen] = useState(false);
  const [linkDialogContent, setLinkDialogContent] = useState('');
  const [jointDialogContent, setJointDialogContent] = useState('');

  const jointDialogData = (data) => (
    <>
      <Typography variant="h6">Joint Name : {data.name}</Typography>
      <Divider/>
      <Typography variant="body1">Type : {data.type}</Typography>
      <Divider/>
      <Typography variant="body1">Parent : {data.parent}</Typography>
      <Divider/>
      <Typography variant="body1">Child : {data.child}</Typography>
      <Divider/>
      <Typography variant="body1">Origin :</Typography>
      <Typography variant="body2">XYZ : {data.origin.xyz}</Typography>
      <Typography variant="body2">RPY : {data.origin.rpy}</Typography>
      <Divider/>
      <Typography variant="body1">Axis :</Typography>
      <Typography variant="body2">XYZ : {data.axis.xyz}</Typography>
      <Divider/>
      <Typography variant="body1">Limits :</Typography>
      {data.limit != null ? <> <Typography variant="body2">Lower : {data.limit.lower}</Typography>
      <Typography variant="body2">Upper : {data.limit.upper}</Typography>
      <Typography variant="body2">Effort : {data.limit.effort}</Typography>
      <Typography variant="body2">Velocity : {data.limit.velocity}</Typography> </>:<>
      <Typography variant="body2">Cyclic</Typography> </> }
    </>
  );

  const linkDialogData = (data) => (
    <>
      <Typography variant="h6">Link Name: {data.name}</Typography>
      <Divider/>
      {data.collision && (Array.isArray(data.collision) ? data.collision : [data.collision]).map((collision, index) => (
        <div key={index}>
          <Typography variant="body1">Collision : {index + 1}:</Typography>
          <Divider/>
          <Typography variant="body1">Geometry :</Typography>
          {collision.geometry.mesh ? <><Typography variant="body2">mesh :</Typography>
          <Typography variant="body2">Filename : {collision.geometry.mesh.filename}</Typography></>: <>
          <Typography variant="body2">Cylinder :</Typography>
          <Typography variant="body2">Radius : {collision.geometry.cylinder.radius}</Typography>
          <Typography variant="body2">Length : {collision.geometry.cylinder.length}</Typography>
          </>}
          <Divider/>
          <Typography variant="body1">Origin :</Typography>
          <Typography variant="body2">Origin XYZ: {collision.origin.xyz}</Typography>
          <Typography variant="body2">Origin RPY: {collision.origin.rpy}</Typography>
          <Divider/>
        </div>
      ))}
      {data.visual && data.visual.map((visual, index) => (
        <div key={index}>
          <Typography variant="body1">Visual : {index + 1}:</Typography>
          <Divider/>
          <Typography variant="body1">Geometry :</Typography>
          <Typography variant="body2">mesh :</Typography>
          <Typography variant="body2">Filename: {visual.geometry.mesh.filename}</Typography>
          <Divider/>
          <Typography variant="body1">Material :</Typography>
          <Typography variant="body2">Color :</Typography>
          <Typography variant="body2">rgba: {visual.material.color.rgba}</Typography>
          <Divider/>
          <Typography variant="body1">Origin :</Typography>
          <Typography variant="body2">Origin XYZ: {visual.origin.xyz}</Typography>
          <Typography variant="body2">Origin RPY: {visual.origin.rpy}</Typography>
          <Divider/>
        </div>
      ))}
      {data.inertial && (
      <>
        <Typography variant="body1">Inertial:</Typography>
        <Divider/>
        <Typography variant="body2">Inertia:</Typography>
        <Typography variant="body2">IXX: {data.inertial.inertia.ixx}</Typography>
        <Typography variant="body2">IXY: {data.inertial.inertia.ixy}</Typography>
        <Typography variant="body2">IXZ: {data.inertial.inertia.ixz}</Typography>
        <Typography variant="body2">IYY: {data.inertial.inertia.iyy}</Typography>
        <Typography variant="body2">IYZ: {data.inertial.inertia.iyz}</Typography>
        <Typography variant="body2">IZZ: {data.inertial.inertia.izz}</Typography>
        <Divider/>
        <Typography variant="body1">Mass:</Typography>
        <Typography variant="body2">Value: {data.inertial.mass.value}</Typography>
        <Divider/>
        <Typography variant="body1">Origin:</Typography>
        <Typography variant="body2">XYZ: {data.inertial.origin.xyz}</Typography>
        <Typography variant="body2">RPY: {data.inertial.origin.rpy}</Typography>
      </>
    )}
    </>
  );


  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleLinkDialogOpen = (content) => {
    setLinkDialogContent(linkDialogData(content));
    setLinkDialogOpen(true);
  };

  const handleJointDialogOpen = (content) => {
    setJointDialogContent(jointDialogData(content));
    setJointDialogOpen(true);
  };

  const handleLinkDialogClose = () => {
    setLinkDialogOpen(false);
    setLinkDialogContent('');
  };

  const handleJointDialogClose = () => {
    setJointDialogOpen(false);
    setJointDialogContent('');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const treeres = await fetch('/api/projectData/treeView');
        const kinematicres = await fetch('/api/projectData/kinematicData');

        if (!treeres.ok || !kinematicres) {
          throw new Error('Failed to fetch project data');
        }
        const treedata = await treeres.json();
        const kinematicdata = await kinematicres.json();
        setTreeData(treedata);
        setKinematicData(kinematicdata);
        //console.log(kinematicdata);
        setLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        console.log(error.message);
        setLoading(false); // Set loading to false even if there's an error
      }
    };

    fetchData();
  }, []);

  return (
    <Drawer
      anchor="left"
      variant="persistent"
      open={open}
      onClose={toggleDrawer}
      sx={{ zIndex: zIndex, position: 'relative' }}
      PaperProps={{ sx: { width: 400 } }}
    >
      {drawerName === "Project Explorer" ?
        <>
          <Box sx={{ width: 350, ml: 5, pl: 2, mt: 8 }}>
            <Typography variant="h6" sx={{ p: 1 }}>
              {drawerName}
            </Typography>
            <Box sx={{ height: '100%', padding: 2 }}>
              {treeData && <RichTreeView slots={{
                expandIcon: AddBoxRounded,
                collapseIcon: IndeterminateCheckBoxRounded,
                endIcon: DisabledByDefaultRounded,
              }} items={treeData} />}
            </Box>
            <Divider />
            {/* Additional static items can be added here */}
          </Box>
        </> : null}

      {drawerName === "Kinematic Property" ?
        <>
          <Box sx={{ width: 350, ml: 5, pl: 2, mt: 8 }}>
            <Typography variant="h6" sx={{ p: 1 }}>
              {drawerName}
            </Typography>
            <Box sx={{ height: 200, width: '100%', padding: 2 }}>
              <Typography variant="h6" sx={{ p: 1 }}>
                Links
              </Typography>
              {kinematicData && kinematicData.links && kinematicData.links.map((link, index) => (
                <Button key={index} onClick={() => handleLinkDialogOpen(link)}>{link.name}</Button>
              ))}
            </Box>
            <Divider />
            <Box sx={{ height: 200, width: '100%', padding: 2 }}>
              <Typography variant="h6" sx={{ p: 1 }}>
                Joints
              </Typography>
              {kinematicData && kinematicData.joints && kinematicData.joints.map((joint, index) => (
                <Button key={index} onClick={() => handleJointDialogOpen(joint)}>{joint.name}</Button>
              ))}
            </Box>
          </Box>
        </> : null}

      {drawerName === "JOG Controls" ?
        <>
          <Box sx={{ height: 450, width: 360, ml: 5, pl: 1, mt: 8 }}>
            <Typography variant="h6" sx={{ pl: 2, pt: 1 }}>
              {drawerName}
            </Typography>
            <Divider sx={{ width: 350 }} />
            <TabContext value={value}>
              <Box sx={{ bgcolor: 'background.paper', height: '100%', width: '100%' }}>
                <TabList
                  value={value}
                  onChange={handleChange}
                  variant="fullWidth"
                  aria-label="Vertical tabs example"
                  sx={{ borderRight: 1, borderColor: 'divider', width: '100%' }}
                >
                  <Tab label="Joint Axis" value="one" />
                  <Tab label="World Axis" value="two" />
                  <Tab label="Tool Axis" value="three" />
                </TabList>
                <TabPanel value="one">
                  <Typography varient='h8' sx={{ p: 1, pb: 2, pt: 0 }}>
                    Course
                    <Switch />
                    Fine
                  </Typography>
                  {kinematicData && kinematicData.joints && kinematicData.joints.map((joint, index) => (
            <div key={`${index}_div`}>
            <Typography key={`${index}_typo`} variant="h8" sx={{ p: 1 }}>
              {joint.name}
            </Typography>
            <Slider key={`${index}_slide`} size="small"
        defaultValue={0}
        aria-label="Small"
        valueLabelDisplay="auto" sx={{ width: 250}}/>
           </div>
          ))}    

                </TabPanel>
                <TabPanel value="two">
                  <Typography varient='h8' sx={{ p: 1, pb: 2, pt: 0 }}>
                    Course
                    <Switch />
                    Fine
                  </Typography>
                  {["X", "Y", "Z", "Rx", "Ry", "Rz"].map((axis, index) => (
                    <div key={`${index}_div`}>
                      <Typography key={`${index}_typo`} variant="h8" sx={{ p: 1 }}>
                        {axis} Axis
                      </Typography>
                      <Slider key={`${index}_slide`}
                        size="small"
                        defaultValue={0}
                        aria-label="Small"
                        valueLabelDisplay="auto"
                        sx={{ width: 300 }}
                      />
                    </div>
                  ))}
                </TabPanel>
                <TabPanel value="three">
                  <Typography varient='h8' sx={{ p: 1, pb: 2, pt: 0 }}>
                    Course
                    <Switch />
                    Fine
                  </Typography>
                  {["X", "Y", "Z", "Rx", "Ry", "Rz"].map((axis, index) => (
                    <div key={`${index}_div`}>
                      <Typography key={`${index}_typo`} variant="h8" sx={{ p: 1 }}>
                        {axis} Axis
                      </Typography>
                      <Slider key={`${index}_slide`}
                        size="small"
                        defaultValue={0}
                        aria-label="Small"
                        valueLabelDisplay="auto"
                        sx={{ width: 300 }}
                      />
                    </div>
                  ))}
                </TabPanel>
              </Box>
            </TabContext>
          </Box>
        </> : null}

      <Dialog open={jointDialogOpen} onClose={handleJointDialogClose}>
        <DialogTitle>{drawerName}</DialogTitle>
        <DialogContent>
        {jointDialogContent}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleJointDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={linkDialogOpen} onClose={handleLinkDialogClose}>
        <DialogTitle>{drawerName}</DialogTitle>
        <DialogContent>
        {linkDialogContent}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLinkDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default ProjectExplorer;
