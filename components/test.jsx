import React, { useState } from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function TestSelect() {
  const [value, setValue] = useState("Number");
  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      onMouseDown={(e) => e.stopPropagation()}
      MenuProps={{
        disablePortal: true // Forces the menu to stay inside the parent component
      }}
    >
      <MenuItem value="Number">Number</MenuItem>
      <MenuItem value="String">String</MenuItem>
      <MenuItem value="Boolean">Boolean</MenuItem>
    </Select>
  );
}

export default TestSelect;
