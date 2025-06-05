import React from 'react';
import './Navbar.css';

export default function Navbar({ onGenerate, onMerge, onQuick, onHeap, onBubble, size, onSizeChange }) {
    return (
      <div className="navbar">
        <h2 className="navbar-title">Sorting Visualizer</h2>
        <div className="navbar-buttons">
          <button onClick={onGenerate}>Generate New Array</button>
          <button onClick={onMerge}>Merge Sort</button>
          <button onClick={onQuick}>Quick Sort</button>
          <button onClick={onHeap}>Heap Sort</button>
          <button onClick={onBubble}>Bubble Sort</button>
          <div className="slider-container">
            <label>Array Size: {size}</label>
            <input
              type="range"
              min="10"
              max="400"
              value={size}
              onChange={onSizeChange}
            />
          </div>
        </div>
      </div>
    );
  }
