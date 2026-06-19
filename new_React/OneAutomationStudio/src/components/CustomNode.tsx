"use client";
import React, { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "@mui/material";
import * as yup from "yup";

const dataTypes = [
  "Bool",
  "Byte",
  "Word",
  "DWord",
  "LWord",
  "Short Int",
  "Int",
  "DInt",
  "Signed Short Int",
  "Signed Int",
  "Signed DInt",
  "Unsigned Short Int",
  "Unsigned Int",
  "Unsigned DInt",
  "Float",
  "Real",
  "Char"
];

const bounds = {
  Byte: [0, 255],
  Word: [0, 65535],
  DWord: [0, 4294967295],
  ShortInt: [-32768, 32767],
  Int: [-2147483648, 2147483647],
  DInt: [-2147483648, 2147483647],
  SignedShortInt: [-32768, 32767],
  SignedInt: [-2147483648, 2147483647],
  SignedDInt: [-2147483648, 2147483647],
  UnsignedShortInt: [0, 65535],
  UnsignedInt: [0, 4294967295],
  UnsignedDInt: [0, 4294967295]
};

// Get Schema for Validation
const getSchemaForType = (type) => {
  if (type === "Bool") return yup.boolean().oneOf([true, false]);
  if (type === "Char") return yup.string().length(1);
  if (["Float", "Real"].includes(type)) return yup.number();
  if (bounds[type])
    return yup.number().integer().min(bounds[type][0]).max(bounds[type][1]);
  return null;
};

// Validate and Convert Input
const validateAndConvert = (value, type, numSystem) => {
  try {
    let num;
    const schema = getSchemaForType(type);

    if (!schema) return { isValid: false, convertedValue: "" };

    if (numSystem === "hexadecimal" && bounds[type]) {
      yup
        .string()
        .matches(/^0x[0-9a-fA-F]+$/, "Invalid hexadecimal format")
        .validateSync(value);
      num = value.startsWith("0x") ? parseInt(value.substring(2), 16) : 0;
    } else {
      num =
        type === "Bool" ? value === "true" || value === true : Number(value);
      schema.validateSync(num);
    }

    const convertedValue =
      numSystem === "hexadecimal"
        ? `0x${num.toString(16).toUpperCase()}`
        : num.toString();

    return { isValid: true, convertedValue };
  } catch (error) {
    return { isValid: false, convertedValue: "" };
  }
};

const CustomNode = ({ id, label, data, onDelete, setNodes, numberSystem }) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState(data.value || "");
  const [isValid, setIsValid] = useState(true);
  const [convertedValue, setConvertedValue] = useState("");

  useEffect(() => {
    setInputValue(data.value || "");
    const result = validateAndConvert(data.value, data.type, numberSystem);
    setIsValid(result.isValid);
    setConvertedValue(result.convertedValue);
  }, [data.value, data.type, numberSystem]);

  const handleValueChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const result = validateAndConvert(val, data.type, numberSystem);
    setIsValid(result.isValid);
    setConvertedValue(result.convertedValue);
  };

  const handleInputBlur = () => {
    if (isValid) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, value: inputValue } }
            : node
        )
      );
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, type: newType, value: "" } }
          : node
      )
    );
    setInputValue("");
    setIsValid(true);
    setConvertedValue("");
  };

  return (
    <div
      className="p-4 text-center rounded-md shadow-md min-w-[150px] relative"
      style={{
        backgroundColor: theme.palette.background.primary,
        color: theme.palette.text.primary
      }}
    >
      <div className="text-sm font-semibold">{label}</div>

      {/* Data Type Selector */}
      <select
        value={data.type || ""}
        onChange={handleTypeChange}
        className="w-full mt-2 p-1 border rounded"
        style={{
          backgroundColor: theme.palette.background.secondary,
          color: theme.palette.text.primary
        }}
      >
        <option value="" disabled>
          Select DataType
        </option>
        {dataTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Boolean Radio Buttons */}
      {data.type === "Bool" ? (
        <div className="flex justify-center gap-2 mt-2">
          <label>
            <input
              type="radio"
              name={`bool-${id}`}
              value="true"
              onChange={handleValueChange}
              checked={inputValue === "true"}
            />{" "}
            True
          </label>
          <label>
            <input
              type="radio"
              name={`bool-${id}`}
              value="false"
              onChange={handleValueChange}
              checked={inputValue === "false"}
            />{" "}
            False
          </label>
        </div>
      ) : (
        <input
          type={
            ["Byte", "Word", "DWord"].includes(data.type) ? "number" : "text"
          }
          value={inputValue}
          onChange={handleValueChange}
          onBlur={handleInputBlur}
          min={bounds[data.type]?.[0]}
          max={bounds[data.type]?.[1]}
          placeholder={
            bounds[data.type]
              ? `Range: ${bounds[data.type][0]} - ${bounds[data.type][1]}`
              : ""
          }
          className={`w-full mt-2 p-1 border rounded ${isValid ? "" : "border-red-500"}`}
          style={{
            backgroundColor: theme.palette.background.secondary,
            color: theme.palette.text.primary
          }}
        />
      )}

      {/* Converted Value Display */}
      {convertedValue && inputValue !== convertedValue && (
        <div className="text-xs text-gray-500 mt-1">
          {numberSystem === "hexadecimal" ? "Hex:" : "Dec:"} {convertedValue}
        </div>
      )}

      {/* Delete Button */}
      <button
        onClick={() => onDelete(id)}
        className="absolute top-1 right-1 text-xs text-red-500"
      >
        ✕
      </button>

      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 15, height: 15 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 15, height: 15 }}
      />
    </div>
  );
};

export default CustomNode;
