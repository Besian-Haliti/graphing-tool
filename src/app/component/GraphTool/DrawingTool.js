import React, { useRef, useState, useEffect } from "react";
import "./GraphTool.css";
import {
  DotFilledIcon,
  EraserIcon,
  RulerHorizontalIcon,
  Pencil1Icon,
  ResetIcon,
  QuestionMarkIcon,
} from "@radix-ui/react-icons";

export default function DrawingTool({ setGraphData }) {
    const [elements, setElements] = useState([]); // Store all lines, labels, points, and intersections
    const canvasRef = useRef(null);
    const [showInfo, setShowInfo] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState("line"); // 'line', 'freeDraw', 'label', 'point', 'eraser'
    const [startPoint, setStartPoint] = useState(null); 
    const [currentFreeDraw, setCurrentFreeDraw] = useState([]); // Points for the currently free-drawn line
    const [intersectionPoint, setIntersectionPoint] = useState(null); // Hovered intersection point
    const [undoStack, setUndoStack] = useState([]); // Undo stack
    const [newLabel, setNewLabel] = useState(""); // Label text
    const [draggingLabelIndex, setDraggingLabelIndex] = useState(null); // Index of dragged label

    useEffect(() => {
        drawCanvas();
    }, [elements, intersectionPoint, currentFreeDraw]);

    useEffect(() => {
      const graphData = { axis, elements };
      setGraphData(graphData); // Pass updated graphData to GraphTool
    }, [elements, setGraphData]);

    const axis = [
        {
          "type": "x-axis line",
          "start": {
            "x": 0,
            "y": 0
          },
          "end": {
            "x": 750,
            "y": 0
          }
        },
        {
          "type": "y-axis line",
          "start": {
            "x": 0,
            "y": 0
          },
          "end": {
            "x": 0,
            "y": 580
          }
        }
      ]

      useEffect(() => {
        const canvasHeight = 620; // height of your canvas
        
        const adjustedElements = elements.map(element => {
          if (element.type === "line") {
            // Adjust both x and y positions of lines
            return {
              ...element,
              start: {
                x: element.start.x - 50, // subtract 50 from x
                y: canvasHeight - (element.start.y - 20), // subtract 20 from y, then flip
              },
              end: {
                x: element.end.x - 50, // subtract 50 from x
                y: canvasHeight - (element.end.y - 20), // subtract 20 from y, then flip
              },
            };
          } else if (element.type === "freeDraw") {
            // Adjust for freeDraw elements (lines drawn freely)
            return {
              ...element,
              points: element.points.map(point => ({
                x: point.x - 50, // subtract 50 from x
                y: canvasHeight - (point.y - 20), // subtract 20 from y, then flip
              })),
            };
          } else if (element.type === "label") {
            // Adjust for label elements
            return {
              ...element,
              x: element.x - 50, // subtract 50 from x
              y: canvasHeight - (element.y - 20), // subtract 20 from y, then flip
            };
          } else if (element.type === "point") {
            // Adjust for point elements
            return {
              ...element,
              x: element.x - 50, // subtract 50 from x
              y: canvasHeight - (element.y - 20), // subtract 20 from y, then flip
            };
          } else if (element.type === "dottedLine") {
            // Adjust for dotted line elements
            return {
              ...element,
              start: {
                x: element.start.x - 50, // subtract 50 from x
                y: canvasHeight - (element.start.y - 20), // subtract 20 from y, then flip
              },
              end: {
                x: element.end.x - 50, // subtract 50 from x
                y: canvasHeight - (element.end.y - 20), // subtract 20 from y, then flip
              },
            };
          }
          return element;
        });
      
        // Set the updated graph data
        const graphData = { axis, elements: adjustedElements };
        setGraphData(graphData); // Pass updated graphData to GraphTool
      
      }, [elements, setGraphData]);      

      const assignLabelToNearbyElements = () => {
        const updatedElements = elements.map((element) => {
            if (element.type === "line" || element.type === "freeDraw") {
                let isNearbyLabel = null;
                let labelColor = null;
    
                // Check for labels within a 10-pixel radius
                elements.forEach((label) => {
                    if (label.type === "label") {
                        if (element.type === "line") {
                            const { start, end } = element;
                            const distanceToStart = Math.sqrt(
                                (label.x - start.x) ** 2 + (label.y - start.y) ** 2
                            );
                            const distanceToEnd = Math.sqrt(
                                (label.x - end.x) ** 2 + (label.y - end.y) ** 2
                            );
    
                            if (distanceToStart <= 25 || distanceToEnd <= 25) {
                                isNearbyLabel = label.text;
                                labelColor = label.color; // Capture the label's color
                            }
                        } else if (element.type === "freeDraw") {
                            const isNearby = element.points.some(
                                (point) =>
                                    Math.sqrt(
                                        (label.x - point.x) ** 2 +
                                        (label.y - point.y) ** 2
                                    ) <= 25
                            );
    
                            if (isNearby) {
                                isNearbyLabel = label.text;
                                labelColor = label.color; // Capture the label's color
                            }
                        }
                    }
                });
    
                if (isNearbyLabel) {
                    return { ...element, name: isNearbyLabel, color: labelColor }; // Add name and color properties
                } else {
                    const { name, color, ...rest } = element; // Remove name and color if not nearby
                    return rest;
                }
            }
            return element;
        });
    
        setElements(updatedElements);
      };
    
    
      const drawCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
    
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        // Draw Axes
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
    
        // Y-Axis
        ctx.beginPath();
        ctx.moveTo(50, 20);
        ctx.lineTo(50, 580);
        ctx.stroke();
    
        // X-Axis
        ctx.beginPath();
        ctx.moveTo(50, 580);
        ctx.lineTo(750, 580);
        ctx.stroke();
    
        // Draw Elements (Lines, Free Draw, Labels, Points, Intersections)
        elements.forEach((element, index) => {
          if (element.type === "line") {
            ctx.strokeStyle = element.color || "#000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(element.end.x, element.end.y);
            ctx.stroke();
          } else if (element.type === "freeDraw") {
            ctx.strokeStyle = element.color || "#000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            element.points.forEach((point, idx) => {
              if (idx === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            ctx.stroke();
          } else if (element.type === "label") {
            ctx.font = "16px Arial";
            ctx.fillStyle = draggingLabelIndex === index ? "red" : element.color || "#000";
            ctx.fillText(element.text, element.x, element.y);
          } else if (element.type === "point") {
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.arc(element.x, element.y, 5, 0, 2 * Math.PI);
            ctx.fill();
          } else if (element.type === "dottedLine") {
            ctx.strokeStyle = "#000";
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(element.end.x, element.end.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
    
        // Draw Current Free Draw
        if (tool === "freeDraw" && currentFreeDraw.length > 0) {
          ctx.strokeStyle = "#999";
          ctx.lineWidth = 2;
          ctx.beginPath();
          currentFreeDraw.forEach((point, idx) => {
            if (idx === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        }
    
        // Draw Intersection Point (if hovering)
        if (intersectionPoint) {
          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.arc(intersectionPoint.x, intersectionPoint.y, 5, 0, 2 * Math.PI);
          ctx.fill();
    
          // Draw temporary dotted lines for hover
          ctx.strokeStyle = "#999";
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(intersectionPoint.x, intersectionPoint.y);
          ctx.lineTo(intersectionPoint.x, 580);
          ctx.stroke();
    
          ctx.beginPath();
          ctx.moveTo(intersectionPoint.x, intersectionPoint.y);
          ctx.lineTo(50, intersectionPoint.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      };
    
      const getMousePosition = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      };
    
      const handleMouseDown = (e) => {
        const{x,y} = getMousePosition(e);
    
        saveForUndo();
    
        if (tool === "label" && newLabel) {
          const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
          const newLabelElement = { type: "label", text: newLabel, x, y, color: randomColor };
          setElements([...elements, newLabelElement]);
          setNewLabel("");
          return;
        }
    
        if (tool === "eraser") {
          // Erase the clicked element
          const elementIndex = elements.findIndex((element) => isElementClicked(element, x, y));
          if (elementIndex !== -1) {
            setElements((prev) => prev.filter((_, index) => index !== elementIndex));
          }
          return;
        }
    
        if (intersectionPoint) {
          // Add the dotted lines permanently
          const verticalLine = {
            type: "dottedLine",
            start: { x: intersectionPoint.x, y: intersectionPoint.y },
            end: { x: intersectionPoint.x, y: 580 },
          };
          const horizontalLine = {
            type: "dottedLine",
            start: { x: intersectionPoint.x, y: intersectionPoint.y },
            end: { x: 50, y: intersectionPoint.y },
          };
          setElements([...elements, verticalLine, horizontalLine]);
          setIntersectionPoint(null);
          return;
        }
    
        if (tool === "line") {
          if (!isDrawing) {
            setStartPoint({ x, y });
            setIsDrawing(true);
          } else {
            const newLine = { type: "line", start: startPoint, end: { x, y } };
            setElements([...elements, newLine]);
            setStartPoint(null);
            setIsDrawing(false);
          }
        } else if (tool === "freeDraw") {
          setIsDrawing(true);
          setCurrentFreeDraw([{ x, y }]);
        } else if (tool === "point") {
          const newPoint = { type: "point", x, y };
          setElements([...elements, newPoint]);
        } else {
          // Check if a label is clicked for dragging
          const clickedLabelIndex = elements.findIndex(
            (element) =>
              element.type === "label" &&
              Math.abs(element.x - x) < 20 &&
              Math.abs(element.y - y) < 20
          );
          if (clickedLabelIndex !== -1) {
            setDraggingLabelIndex(clickedLabelIndex);
          }
        }
      };
    
      const handleMouseMove = (e) => {
        const { x, y } = getMousePosition(e);
      
        if (isDrawing) {
          if (tool === "line") {
            drawCanvas();
            const ctx = canvasRef.current.getContext("2d");
            ctx.strokeStyle = "#999";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          } else if (tool === "freeDraw") {
            setCurrentFreeDraw((prev) => [...prev, { x, y }]);
          }
        } else if (draggingLabelIndex !== null) {
          // Update the position of the dragged label
          setElements((prev) =>
            prev.map((element, index) =>
              index === draggingLabelIndex ? { ...element, x, y } : element
            )
          );
        } else {
          // Track all intersections
          let foundIntersections = [];
      
          for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
              const intersections = getIntersection(elements[i], elements[j]);
              if (intersections) {
                // Filter intersections that are close to the mouse cursor
                const closeIntersections = intersections.filter(
                  (intersection) =>
                    Math.abs(intersection.x - x) < 10 && Math.abs(intersection.y - y) < 10
                );
                foundIntersections = [...foundIntersections, ...closeIntersections];
              }
            }
          }
      
          // If any intersections were found, set the intersection point
          if (foundIntersections.length > 0) {
            setIntersectionPoint(foundIntersections[0]); // Or choose how to handle multiple intersections
          } else {
            setIntersectionPoint(null);
          }
        }
      };
      
    
      const handleMouseUp = () => {
        if (tool === "freeDraw" && isDrawing) {
          const newFreeDraw = { type: "freeDraw", points: currentFreeDraw };
          setElements([...elements, newFreeDraw]);
          setCurrentFreeDraw([]);
          setIsDrawing(false);
          
        } else if (draggingLabelIndex !== null) {
          assignLabelToNearbyElements();
          setDraggingLabelIndex(null);
        }
      };
    
      const saveForUndo = () => {
        setUndoStack((prev) => [...prev, [...elements]]);
      };
    
      const undo = () => {
        if (undoStack.length > 0) {
          const previousState = undoStack.pop();
          setUndoStack([...undoStack]);
          setElements(previousState);
        }
      };
      
    
      const isElementClicked = (element, x, y) => {
        if (element.type === "line" || element.type === "dottedLine") {
          const { start, end } = element;
          const distance =
            Math.abs((end.y - start.y) * x - (end.x - start.x) * y + end.x * start.y - end.y * start.x) /
            Math.sqrt((end.y - start.y) ** 2 + (end.x - start.x) ** 2);
          return distance < 5;
        } else if (element.type === "point") {
          const distance = Math.sqrt((element.x - x) ** 2 + (element.y - y) ** 2);
          return distance < 10;
        } else if (element.type === "label") {
          return Math.abs(element.x - x) < 20 && Math.abs(element.y - y) < 20;
        } else if (element.type === "freeDraw") {
          return element.points.some((point) => Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2) < 5);
        }
        return false;
      };
    
      const getIntersection = (line1, line2) => {
        if (
          (line1.type === "line" || line1.type === "freeDraw") &&
          (line2.type === "line" || line2.type === "freeDraw")
        ) {
          const points1 = line1.type === "freeDraw" ? line1.points : [line1.start, line1.end];
          const points2 = line2.type === "freeDraw" ? line2.points : [line2.start, line2.end];
          
          const intersections = [];  // Array to store all intersection points
      
          // Loop through each segment of the two lines/freeDraws
          for (let i = 0; i < points1.length - 1; i++) {
            for (let j = 0; j < points2.length - 1; j++) {
              const segment1 = { start: points1[i], end: points1[i + 1] };
              const segment2 = { start: points2[j], end: points2[j + 1] };
              const intersection = calculateSegmentIntersection(segment1, segment2);
              
              if (intersection) {
                intersections.push(intersection); // Add intersection to the array
              }
            }
          }
      
          // Return all found intersections, or null if no intersections
          return intersections.length > 0 ? intersections : null;
        }
        return null;
      };
      
    
      const calculateSegmentIntersection = (seg1, seg2) => {
        if (!seg1 || !seg2 || !seg1.start || !seg1.end || !seg2.start || !seg2.end) {
          return null;
        }
      
        const { x: x1, y: y1 } = seg1.start;
        const { x: x2, y: y2 } = seg1.end;
        const { x: x3, y: y3 } = seg2.start;
        const { x: x4, y: y4 } = seg2.end;
      
        const epsilon = 1e-10; // Small tolerance for floating-point comparisons
      
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      
        // Check if lines are parallel (denominator is close to zero)
        if (Math.abs(denom) < epsilon) {
          // Check if lines are collinear
          const crossProduct = (x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1);
          if (Math.abs(crossProduct) < epsilon) {
            // Lines are collinear; check for overlap
            const isBetween = (a, b, c) => Math.min(a, b) - epsilon <= c && c <= Math.max(a, b) + epsilon;
      
            const intersections = [];
            // Check if any of the endpoints overlap or if the segments overlap
            if (isBetween(x1, x2, x3) && isBetween(y1, y2, y3)) intersections.push({ x: x3, y: y3 });
            if (isBetween(x1, x2, x4) && isBetween(y1, y2, y4)) intersections.push({ x: x4, y: y4 });
            if (isBetween(x3, x4, x1) && isBetween(y3, y4, y1)) intersections.push({ x: x1, y: y1 });
            if (isBetween(x3, x4, x2) && isBetween(y3, y4, y2)) intersections.push({ x: x2, y: y2 });
      
            // Return all intersection points for collinear overlaps
            return intersections.length > 0 ? intersections : null;
          }
          return null; // Parallel but not collinear
        }
      
        // Calculate intersection point for non-parallel lines
        const intersectX =
          ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
        const intersectY =
          ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;
      
        // Check if the intersection point lies on both segments
        const isOnSegment = (px, py, xA, yA, xB, yB) =>
          Math.min(xA, xB) - epsilon <= px &&
          px <= Math.max(xA, xB) + epsilon &&
          Math.min(yA, yB) - epsilon <= py &&
          py <= Math.max(yA, yB) + epsilon;
      
        if (
          isOnSegment(intersectX, intersectY, x1, y1, x2, y2) &&
          isOnSegment(intersectX, intersectY, x3, y3, x4, y4)
        ) {
          return { x: intersectX, y: intersectY };
        }
      
        return null; // No valid intersection
      };      
    
      
    return(
        <div className="graph-tool">
            <div className="toolbar-icons">
                <button
                    title="Info"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                >
                    <QuestionMarkIcon width={24} height={24} />
                    {showInfo && (
                    <div className="info-box">
                        <p>
                        <RulerHorizontalIcon className="ruler"/>
                        This tool draws straight lines, click and drag then click again to place.
                        </p>
                        <p>
                        <Pencil1Icon className="pencil"/>
                        This tool draws free lines, click and drag to draw.
                        </p>
                        <p>
                        <DotFilledIcon className="dot"/>
                        This tool draws points, click to place.
                        </p>
                        <p>
                        <EraserIcon className="eraser"/>
                        This tool erases any lines, click any element to erase it.
                        </p>
                        <p>
                        <ResetIcon className="reset"/>
                        This tool is the undo, click the button to undo the most recent action.
                        </p>
                        <p>If you click on the intersection between 2 lines you can place the connectors to the axis.</p>
                        <p>To use the labels type whatever label you want to create then click add label then click
                        wherever on the graph you want to add the label, you can click and drag to adjust their
                            postitioning.</p>
                    </div>
                    )}
                </button>
                <button onClick={() => setTool("line")} title="Straight Line">
                    <RulerHorizontalIcon width={24} height={24} />
                </button>
                <button onClick={() => setTool("freeDraw")} title="Free Draw">
                    <Pencil1Icon width={24} height={24} />
                </button>
                <button onClick={() => setTool("point")} title="Add Point">
                    <DotFilledIcon width={24} height={24} />
                </button>
                <button onClick={() => setTool("eraser")} title="Eraser">
                    <EraserIcon width={24} height={24} />
                </button>
                <button onClick={undo} title="Undo">
                    <ResetIcon width={24} height={24} />
                </button>
            </div>
            <canvas
                ref={canvasRef}
                width={800}
                height={620}
                className="graph-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
            <div className="bottom-controls">
                <input
                    type="text"
                    placeholder="Label text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="label-input"
                />
                <button className="add-label-button" onClick={() => setTool("label")}>Add Label</button>
            </div>
        </div>
    );
}
