"use client";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Button,
  Drawer,
  useTheme,
  MenuItem,
  Select,
  TextField,
  Paper,
  Typography,
  Box,
  styled,
  RadioGroup,
  FormControlLabel,
  Radio
} from "@mui/material";
import { v4 as uuidv4 } from "uuid"; // Import uuidv4
import * as yup from "yup"; // Import Yup
import CustomNode from "./CustomNode";

const CustomControls = styled(Controls)(({ theme }) => ({
  "& button": {
    background: theme.palette.background.primary,
    borderBottom: `1px solid ${theme.palette.background.quaternary}`,
    color: theme.palette.text.secondary
  },
  "& button:hover": {
    background: theme.palette.background.tertiary,
    color: theme.palette.text.primary
  }
}));

const standardBlocks = [
  { id: "constant", label: "Constant", type: "constant" },
  { id: "variable", label: "Variable", type: "variable" },
  { id: "add", label: "Add", type: "operation" },
  { id: "sub", label: "Subtract", type: "operation" },
  { id: "mul", label: "Multiply", type: "operation" },
  { id: "div", label: "Divide", type: "operation" }
];

const GraphEditor = ({ content, onChange, onSaveFile }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [numberSystem, setNumberSystem] = useState("decimal");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const theme = useTheme();
  const { getSelectedEdges: rfGetSelectedEdges } = useReactFlow();

  // Handle edge deletion
  // Handle edge deletion
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Delete") {
        const selectedEdges = rfGetSelectedEdges(); // Use the function from the hook
        if (selectedEdges.length > 0) {
          setEdges((eds) =>
            eds.filter((edge) => !selectedEdges.includes(edge))
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rfGetSelectedEdges, setEdges]);

  const NodeTypes = useMemo(
    () => ({
      constant: (props) => (
        <CustomNode
          {...props}
          label="Const"
          onDelete={props.data?.onDelete}
          setNodes={setNodes}
          numberSystem={numberSystem}
        />
      ),
      variable: (props) => (
        <CustomNode
          {...props}
          label="Var"
          onDelete={props.data?.onDelete}
          setNodes={setNodes}
          numberSystem={numberSystem}
        />
      ),
      operation: (props) => (
        <CustomNode
          {...props}
          label={props.data?.label}
          isOperation
          onDelete={props.data?.onDelete}
          setNodes={setNodes}
          numberSystem={numberSystem}
        />
      )
    }),
    [setNodes, numberSystem] // Ensure it updates properly when setNodes changes
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        onSaveFile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSaveFile]);

  useEffect(() => {
    if (!content) return;
    try {
      const parsedData = JSON.parse(content);
      let loadedNodes = parsedData.nodes || [];
      loadedNodes = loadedNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          type: node.data?.type || "Bool",
          onDelete: () => handleDeleteNode(node.id),
          onTypeChange: (e, nodeId) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        type: e.target.value,
                        value: "",
                        inputs: n.type === "operation" ? [null, null] : []
                      }
                    }
                  : n
              )
            );
          },
          onValueChange: (e, nodeId) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, value: e.target.value } }
                  : n
              )
            );
          },
          onAddInput: (nodeId) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      data: { ...n.data, inputs: [...n.data.inputs, null] }
                    }
                  : n
              )
            );
          },
          onRemoveInput: (nodeId) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId && n.data.inputs.length > 1
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        inputs: n.data.inputs.slice(0, -1)
                      }
                    }
                  : n
              )
            );
          }
        }
      }));

      setNodes(loadedNodes);
      setEdges(parsedData.edges || []);
    } catch (e) {
      console.error("Invalid graph data:", e);
    }
  }, []);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: theme.palette.primary.main, strokeWidth: 2 }
          },
          eds
        )
      ),
    [setEdges, theme]
  );

  useEffect(() => {
    const graphData = JSON.stringify({ nodes, edges }, null, 2); // Add space parameter
    if (graphData !== content) {
      onChange(graphData);
    }
  }, [nodes, edges]);

  useEffect(() => {
    setEdges((prevEdges) => {
      const updatedEdges = prevEdges.map((edge) => ({
        ...edge,
        style: { strokeWidth: 2 }
      }));

      // Check if the updated edges are actually different
      if (JSON.stringify(prevEdges) === JSON.stringify(updatedEdges)) {
        return prevEdges; // No change, return the previous state
      }

      return updatedEdges; // Return the updated state
    });
  }, [edges]);

  const handleDragStart = (event, block) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(block));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const block = JSON.parse(
      event.dataTransfer.getData("application/reactflow")
    );

    const newNodeId = uuidv4();

    const newNode = {
      id: newNodeId,
      type: block.type,
      position: { x: event.clientX - 200, y: event.clientY - 100 },
      data: {
        label: block.label,
        type: "Bool",
        value: "",
        inputs: block.type === "operation" ? [null, null] : [],
        setNodes,
        result: "",
        onDelete: () => handleDeleteNode(newNodeId),
        onTypeChange: (e, nodeId) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      type: e.target.value,
                      value: "",
                      inputs: n.type === "operation" ? [null, null] : []
                    }
                  }
                : n
            )
          );
        },
        onValueChange: (e, nodeId) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, value: e.target.value } }
                : node
            )
          );
        },
        onAddInput: (nodeId) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: { ...node.data, inputs: [...node.data.inputs, null] }
                  }
                : node
            )
          );
        },
        onRemoveInput: (nodeId) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId && node.data.inputs.length > 1
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      inputs: node.data.inputs.slice(0, -1)
                    }
                  }
                : node
            )
          );
        }
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleDeleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh" }}>
      <Drawer
        variant="permanent"
        anchor="right"
        open={drawerOpen}
        PaperProps={{
          sx: {
            width: 150,
            height: "calc(100% - 350px)",
            top: "103px",
            backgroundColor: theme.palette.background.tertiary,
            color: theme.palette.text.secondary,
            transition: "width 0.2s ease",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "thin"
          }
        }}
      >
        <Box p={2} sx={{ backgroundColor: theme.palette.background.tertiary }}>
          <Typography variant="h6">Settings</Typography>
          <RadioGroup
            aria-label="number system"
            name="numberSystem"
            value={numberSystem}
            onChange={(e) => setNumberSystem(e.target.value)}
          >
            <FormControlLabel
              value="decimal"
              control={<Radio />}
              label="Decimal"
            />
            <FormControlLabel
              value="hexadecimal"
              control={<Radio />}
              label="Hexadecimal"
            />
          </RadioGroup>
        </Box>
        <Box p={2} sx={{ backgroundColor: theme.palette.background.tertiary }}>
          <Typography variant="h6">Blocks</Typography>
          {standardBlocks.map((block) => (
            <Paper
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block)}
              sx={{
                padding: 1,
                marginY: 1,
                textAlign: "center",
                cursor: "grab",
                backgroundColor: theme.palette.background.primary,
                color: theme.palette.text.primary,
                boxShadow: 2
              }}
            >
              {block.label}
            </Paper>
          ))}
        </Box>
      </Drawer>
      <Box
        flexGrow={1}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NodeTypes}
          style={{ backgroundColor: theme.palette.background.quaternary }} // Set ReactFlow background color
        >
          {/*<Controls />*/}
          <CustomControls />
          <MiniMap
            nodeColor={() => theme.palette.secondary.main}
            nodeBorderColor={theme.palette.primary.main}
            maskColor={theme.palette.background.primary}
            pannable={true}
            zoomable={true}
            style={{ backgroundColor: theme.palette.background.quaternary }}
          />
          <Background
            variant="dots"
            gap={12}
            size={1}
            color={theme.palette.text.primary}
          />
        </ReactFlow>
      </Box>
    </div>
  );
};

export default GraphEditor;
