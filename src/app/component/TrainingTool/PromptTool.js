"use client";

import React, { useState, useEffect, useRef } from "react";
import "../GraphTool/GraphTool.css";
import "./PromptTool.css"; // Import the new CSS file for styling
import DrawingTool from "../GraphTool/DrawingTool";

export default function PromptTool() {
  const [newPrompt, setNewPrompt] = useState(""); // Input field value (includes fetched prompt)
  const [loading, setLoading] = useState(true); // Loading status
  const [graphData, setGraphData] = useState(null); // Graph data
  const [showDrawingTool, setShowDrawingTool] = useState(false); // Control visibility of DrawingTool
  const textareaRef = useRef(null); // Reference to the textarea element

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const response = await fetch("/api/prompt", { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          setNewPrompt(data.prompt || ""); // Set the fetched prompt as the input box value
        } else {
          console.error("Failed to fetch prompt:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching prompt:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrompt();
  }, []);

  useEffect(() => {
    // Adjust the height of the textarea whenever newPrompt changes
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to match content
    }
  }, [newPrompt,showDrawingTool]);

  async function updatePrompt() {
    try {
      let updatedPrompt;

      if (showDrawingTool) {
        // If the Drawing Tool is visible, append the graph data
        const graphDataString = graphData ? JSON.stringify(graphData) : "No graph data";
        updatedPrompt = `${newPrompt} Here is a modal answer: ${graphDataString}`;
      } else {
        // If Drawing Tool is not visible, just use the newPrompt
        updatedPrompt = newPrompt;
      }

      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPrompt: updatedPrompt }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message); // Log success message
        setNewPrompt(updatedPrompt); // Update the input box with the new prompt
      } else {
        console.error("Failed to update prompt:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating prompt:", error);
    }
  }

  return (
    <div className="prompt-tool-container">
      <div className="prompt-input-container">
        {loading ? (
          <p>Loading prompt...</p>
        ) : (
          <textarea
            className="prompt-input"
            ref={textareaRef}
            value={newPrompt} // Display the fetched prompt in the input box
            onChange={(e) => setNewPrompt(e.target.value)} // Update input box as the user types
          />
        )}
      </div>
      <button className="update-prompt-button" onClick={updatePrompt}>
        Update Prompt
      </button>
      <div className="modal-checkbox-container">
        <label>
          <input
            type="checkbox"
            checked={showDrawingTool}
            onChange={(e) => setShowDrawingTool(e.target.checked)} // Toggle DrawingTool visibility
          />
          Use a Modal Answer
        </label>
      </div>
      {showDrawingTool && (
        <DrawingTool setGraphData={setGraphData} graphData={graphData} />
      )}
    </div>
  );
}
