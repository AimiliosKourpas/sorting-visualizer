import React from 'react';
import './Navbar.css';
import { ALGORITHMS, ALGORITHM_KEYS } from '../sortingAlgorithms/sortingAlgorithms';

export default function Navbar({ selectedAlgorithm, onSelectAlgorithm }) {
  return (
    <header className="navbar">
      <div className="brand">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <rect x="2" y="13" width="4" height="9" rx="1" />
          <rect x="8" y="8" width="4" height="14" rx="1" />
          <rect x="14" y="3" width="4" height="19" rx="1" />
          <rect x="20" y="10" width="2.5" height="12" rx="1" />
        </svg>
        Sorting Visualizer
      </div>

      <nav className="algos" aria-label="Algorithm">
        {ALGORITHM_KEYS.map((algo) => (
          <button
            key={algo}
            onClick={() => onSelectAlgorithm(algo)}
            aria-pressed={selectedAlgorithm === algo}
            className={selectedAlgorithm === algo ? 'selected' : ''}
          >
            {ALGORITHMS[algo].short}
          </button>
        ))}
      </nav>
    </header>
  );
}
