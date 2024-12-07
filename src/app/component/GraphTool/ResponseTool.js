"use client";

import React, { useState, useEffect } from 'react';
import "./GraphTool.css";
export default function ResponseTool({graphData}){
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [responseJSON, setResponseJSON] = useState("");
    const [showSubmitButton, setShowSubmitButton] = useState(true); 
    const [question, setQuestion] = useState("");

    useEffect(() => {
        if (responseJSON && responseJSON.score) {
            // Dynamically update the score circle's gradient
            document.querySelectorAll(".score-circle").forEach((circle) => {
                const score = responseJSON.score.split("/"); // e.g., "3/4"
                const numerator = parseInt(score[0], 10);
                const denominator = parseInt(score[1], 10);
                const percentage = (numerator / denominator) * 100;

                const circleElement = circle.querySelector(".circle");
                circleElement.style.background = `conic-gradient(
                    #ff9800 ${percentage}%,
                    #f5f5f5 ${percentage}%
                )`;
            });
        }
    }, [responseJSON]);

    const exportGraphToJSON = () => {
        setShowSubmitButton(false);
        setLoading(true);
        const payload = {question,graphData};
    
        // Send JSON to backend for Claude analysis
        fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
          .then((response) => {
            if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
            }
            return response.json();
          })
    
          .then((data) => {
            try {
              const jsonMatch = data.response.match(/\{.*\}/);
              const parsedJSON = JSON.parse(jsonMatch);
              setResponseJSON(parsedJSON);
            } catch (error) {
              console.error("Error parsing response JSON:", error);
              setError(error);
            } finally {
              setLoading(false); // Reset loading state
            }
          }) // Update the response text
          .catch((error) => {
            console.error("Error sending graph JSON:", error);
            setError(error);
            setLoading(false);
          });
    };

    return(
    <div className="response-container">
        <input
          type="text"
          placeholder="Enter your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="question-input"
        />
        {showSubmitButton && (
        <button className='submit-button' onClick={exportGraphToJSON}>Submit</button>
        )}
        {loading ? (
            <div className="loading-message">Loading, please wait...</div>
        ) : responseJSON ? (
            <>
            <div className="header">
                <div className="logo">
                <img src="/logo.png" className="logo-img" />
                <span className="logo-text">
                    <strong>Nim AI</strong>
                </span>
                </div>
                <div className="score-circle" data-score={responseJSON.score}>
                <div className="circle">
                    <div className="score-text">{responseJSON.score}</div>
                </div>
                </div>
            </div>
            <div className="section strengths">
                <h4>Strengths</h4>
                <ul>
                {responseJSON.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                ))}
                </ul>
            </div>
            <div className="section weaknesses">
                <h4>Weaknesses</h4>
                <ul>
                {responseJSON.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                ))}
                </ul>
            </div>
            <div className="section tip">
                <h4>Tip:</h4>
                <p>{responseJSON.tip}</p>
            </div>
            </>
        ) : (
            <div className="placeholder-content">
            {error ? (
                <>
                <h4>Error</h4>
                <p>{error.message}</p>
                </>
            ) : (
                <>
                <h4>No response data yet</h4>
                <p>Submit a graph to get feedback.</p>
                </>
            )}
            </div>
        )}
    </div>
    );
}