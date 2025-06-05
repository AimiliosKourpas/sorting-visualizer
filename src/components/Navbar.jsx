import React, { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar({
  onGenerate,
  onSizeChange,
  size,
  onSelectAlgorithm,
  selectedAlgorithm,
  onStartSort,
  sorting
}) {
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when sorting starts or algorithm changes
  useEffect(() => {
    if (sorting) setShowMenu(false);
  }, [sorting]);

  // Close menu on window resize if desktop size
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 600) setShowMenu(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="navbar">
      <button
        className="menu-toggle"
        onClick={() => setShowMenu(prev => !prev)}
        aria-label="Toggle menu"
      >
        &#x22EE; {/* Vertical 3 dots */}
      </button>

      {/* Show menu buttons if desktop or menu toggled */}
      <div className={`menu-items ${showMenu ? 'show' : ''}`}>
        <button
          onClick={onGenerate}
          disabled={sorting}
          className={sorting ? 'disabled' : ''}
        >
          Generate New Array
        </button>

        <input
          type="range"
          min="10"
          max="200"
          value={size}
          onChange={onSizeChange}
          disabled={sorting}
          className={sorting ? 'disabled' : ''}
        />

        {['merge', 'quick', 'heap', 'bubble'].map(algo => (
          <button
            key={algo}
            onClick={() => onSelectAlgorithm(algo)}
            disabled={sorting}
            className={sorting ? 'disabled' : selectedAlgorithm === algo ? 'selected' : ''}
          >
            {algo.charAt(0).toUpperCase() + algo.slice(1)} Sort
          </button>
        ))}

        {selectedAlgorithm && (
          <button
            onClick={onStartSort}
            disabled={sorting}
            className="sort-button"
          >
            Sort!
          </button>
        )}
      </div>
    </nav>
  );
}
