import React, { useState, useRef, useCallback } from 'react';
import { Pencil, Eraser, Undo, Redo, Save } from 'lucide-react';

const TrendLineDrawingTool = ({ 
  width = 800, 
  height = 400, 
  onTrendLinesChange,
  className = '' 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState('trend'); // 'trend', 'horizontal', 'vertical'
  const [currentLine, setCurrentLine] = useState(null);
  const [trendLines, setTrendLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const svgRef = useRef(null);

  const addToHistory = useCallback((lines) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...lines]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleMouseDown = useCallback((e) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentLine({
      id: Date.now(),
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      type: drawingMode,
      color: '#3b82f6',
      width: 2
    });
  }, [drawingMode]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !currentLine || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let endX = x;
    let endY = y;
    
    // Constrain lines based on drawing mode
    if (drawingMode === 'horizontal') {
      endY = currentLine.startY;
    } else if (drawingMode === 'vertical') {
      endX = currentLine.startX;
    }
    
    setCurrentLine(prev => ({
      ...prev,
      endX,
      endY
    }));
  }, [isDrawing, currentLine, drawingMode]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentLine) return;
    
    const newTrendLines = [...trendLines, currentLine];
    setTrendLines(newTrendLines);
    addToHistory(newTrendLines);
    onTrendLinesChange?.(newTrendLines);
    
    setIsDrawing(false);
    setCurrentLine(null);
  }, [isDrawing, currentLine, trendLines, addToHistory, onTrendLinesChange]);

  const clearAllLines = useCallback(() => {
    setTrendLines([]);
    addToHistory([]);
    onTrendLinesChange?.([]);
  }, [addToHistory, onTrendLinesChange]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const lines = history[newIndex];
      setTrendLines(lines);
      setHistoryIndex(newIndex);
      onTrendLinesChange?.(lines);
    }
  }, [history, historyIndex, onTrendLinesChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const lines = history[newIndex];
      setTrendLines(lines);
      setHistoryIndex(newIndex);
      onTrendLinesChange?.(lines);
    }
  }, [history, historyIndex, onTrendLinesChange]);

  const deleteLine = useCallback((lineId) => {
    const newTrendLines = trendLines.filter(line => line.id !== lineId);
    setTrendLines(newTrendLines);
    addToHistory(newTrendLines);
    onTrendLinesChange?.(newTrendLines);
  }, [trendLines, addToHistory, onTrendLinesChange]);

  return (
    <div className={`relative ${className}`}>
      {/* Drawing Tools */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="flex items-center space-x-2">
          {/* Drawing Mode Buttons */}
          <button
            onClick={() => setDrawingMode('trend')}
            className={`p-2 rounded transition-colors ${
              drawingMode === 'trend' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Trend Line"
          >
            <Pencil size={16} />
          </button>
          
          <button
            onClick={() => setDrawingMode('horizontal')}
            className={`p-2 rounded transition-colors ${
              drawingMode === 'horizontal' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Horizontal Line"
          >
            <div className="w-4 h-0.5 bg-current"></div>
          </button>
          
          <button
            onClick={() => setDrawingMode('vertical')}
            className={`p-2 rounded transition-colors ${
              drawingMode === 'vertical' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Vertical Line"
          >
            <div className="w-0.5 h-4 bg-current"></div>
          </button>

          <div className="w-px h-6 bg-gray-300"></div>

          {/* Action Buttons */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={16} />
          </button>
          
          <button
            onClick={clearAllLines}
            className="p-2 rounded text-red-600 hover:bg-red-50"
            title="Clear All"
          >
            <Eraser size={16} />
          </button>
        </div>
      </div>

      {/* Drawing Canvas */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Existing Trend Lines */}
        {trendLines.map((line) => (
          <g key={line.id}>
            <line
              x1={line.startX}
              y1={line.startY}
              x2={line.endX}
              y2={line.endY}
              stroke={line.color}
              strokeWidth={line.width}
              className="pointer-events-auto cursor-pointer hover:stroke-red-500"
              onClick={() => deleteLine(line.id)}
            />
            {/* Line endpoints */}
            <circle
              cx={line.startX}
              cy={line.startY}
              r={4}
              fill={line.color}
              className="pointer-events-auto cursor-pointer"
            />
            <circle
              cx={line.endX}
              cy={line.endY}
              r={4}
              fill={line.color}
              className="pointer-events-auto cursor-pointer"
            />
          </g>
        ))}

        {/* Current Drawing Line */}
        {currentLine && (
          <line
            x1={currentLine.startX}
            y1={currentLine.startY}
            x2={currentLine.endX}
            y2={currentLine.endY}
            stroke={currentLine.color}
            strokeWidth={currentLine.width}
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* Line Count Display */}
      {trendLines.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
          <span className="text-sm text-gray-600">
            {trendLines.length} trend line{trendLines.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default TrendLineDrawingTool;