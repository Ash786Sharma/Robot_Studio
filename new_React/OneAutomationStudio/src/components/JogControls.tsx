// JogControls.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Divider,
  Typography,
  Slider,
  Tabs,
  Tab,
  Switch,
  useTheme
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";

const JogControls = () => {
  const [kinematicData, setKinematicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("one");
  const theme = useTheme();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const kinematicres = await fetch("/api/projectData/kinematicData");
        if (!kinematicres) {
          throw new Error("Failed to fetch project data");
        }
        const kinematicdata = await kinematicres.json();
        setKinematicData(kinematicdata);
        setLoading(false);
      } catch (error) {
        console.log(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box sx={{ height: 450, width: 360, ml: 5, pl: 1, mt: 8 }}>
      <TabContext value={value}>
        <Box
          sx={{
            bgcolor: "background.paper",
            height: "100%",
            width: "100%"
          }}
        >
          <TabList
            value={value}
            onChange={handleChange}
            variant="fullWidth"
            aria-label="Vertical tabs example"
            sx={{ borderRight: 1, borderColor: "divider", width: "100%" }}
          >
            <Tab label="Joint Axis" value="one" />
            <Tab label="World Axis" value="two" />
            <Tab label="Tool Axis" value="three" />
          </TabList>
          <TabPanel value="one">
            <Typography varient="h8" sx={{ p: 1, pb: 2, pt: 0 }}>
              Course
              <Switch />
              Fine
            </Typography>
            {kinematicData &&
              kinematicData.joints &&
              kinematicData.joints.map((joint, index) => (
                <div key={`${index}_div`}>
                  <Typography key={`${index}_typo`} variant="h8" sx={{ p: 1 }}>
                    {joint.name}
                  </Typography>
                  <Slider
                    key={`${index}_slide`}
                    size="small"
                    defaultValue={0}
                    aria-label="Small"
                    valueLabelDisplay="auto"
                    sx={{ width: 250 }}
                  />
                </div>
              ))}
          </TabPanel>
          <TabPanel value="two">
            <Typography varient="h8" sx={{ p: 1, pb: 2, pt: 0 }}>
              Course
              <Switch />
              Fine
            </Typography>
            {["X", "Y", "Z", "Rx", "Ry", "Rz"].map((axis, index) => (
              <div key={`${index}_div`}>
                <Typography key={`${index}_typo`} variant="h8" sx={{ p: 1 }}>
                  {axis} Axis
                </Typography>
                <Slider
                  key={`${index}_slide`}
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
            <Typography varient="h8" sx={{ p: 1, pb: 2, pt: 0 }}>
              Course
              <Switch />
              Fine
            </Typography>
            {["X", "Y", "Z", "Rx", "Ry", "Rz"].map((axis, index) => (
              <div key={`${index}_div`}>
                <Typography key={`${index}_typo`} variant="h8" sx={{ p: 1 }}>
                  {axis} Axis
                </Typography>
                <Slider
                  key={`${index}_slide`}
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
  );
};

export default JogControls;
