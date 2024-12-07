"use client";

import React, { useState } from "react";
import ResponseTool from "./ResponseTool";
import DrawingTool from "./DrawingTool";
import "./GraphTool.css";

export default function GraphTool() {
  const [graphData, setGraphData] = useState(null);

  return (
    <div className="graph-tool-container">
      <DrawingTool setGraphData={setGraphData}/>
      <ResponseTool graphData={graphData}/>
    </div>
  );
}
