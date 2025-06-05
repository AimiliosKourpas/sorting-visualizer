import React from 'react';
import {
  getMergeSortAnimations,
  getQuickSortAnimations,
  getHeapSortAnimations,
  getBubbleSortAnimations,
} from '../sortingAlgorithms/sortingAlgorithms';
import './SortingVisualizer.css';
import Navbar from '../components/Navbar';

const PRIMARY_COLOR = 'turquoise';
const SECONDARY_COLOR = 'red';

export default class SortingVisualizer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      array: [],
      arraySize: 100,
      selectedAlgorithm: null,
      sorting: false,
    };
  }

  componentDidMount() {
    const maxBars = window.innerWidth <= 768 ? 100 : this.state.arraySize; // 768px breakpoint for phones/tablets
    this.setState({ arraySize: Math.min(this.state.arraySize, maxBars) }, this.resetArray);
  
    // Also add a resize listener if you want dynamic resizing on window resize:
    window.addEventListener('resize', this.handleResize);
  }
  
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
  resetArray = () => {
    if (this.state.sorting) return;
    const array = Array.from({ length: this.state.arraySize }, () =>
      randomIntFromInterval(5, 730)
    );
    this.setState({ array, selectedAlgorithm: null }, () => {
      // Reset background color inline styles after state updates
      const arrayBars = document.getElementsByClassName('array-bar');
      for (let bar of arrayBars) {
        bar.style.backgroundColor = '#40c4ff'; // your blue color
      }
    });
  };
  

  handleResize = () => {
    const maxBars = window.innerWidth <= 768 ? 100 : this.state.arraySize;
    if (this.state.arraySize > maxBars) {
      this.setState({ arraySize: maxBars }, this.resetArray);
    }
  };
  
  handleSizeChange = (event) => {
    if (this.state.sorting) return;
  
    let newSize = Number(event.target.value);
    const maxBars = window.innerWidth <= 768 ? 100 : newSize;
  
    if (newSize > maxBars) newSize = maxBars;
  
    this.setState({ arraySize: newSize }, this.resetArray);
  };

  getAnimationSpeed = () => {
    return Math.max(1, Math.floor(300 / this.state.arraySize));
  };

  setAlgorithm = (algo) => {
    if (this.state.sorting) return;
    this.setState({ selectedAlgorithm: algo });
  };

  startSort = () => {
    const { selectedAlgorithm, array } = this.state;
    if (!selectedAlgorithm || this.state.sorting) return;
  
    const arrayCopy = array.slice();
    const animations = this.getAnimations(selectedAlgorithm, arrayCopy);
  
    this.setState({ sorting: true }, () => {
      this.animate(animations, arrayCopy);
    });
  };
  

  getAnimations = (algo, arrayCopy) => {
    switch (algo) {
      case 'merge': return getMergeSortAnimations(arrayCopy);
      case 'quick': return getQuickSortAnimations(arrayCopy);
      case 'heap': return getHeapSortAnimations(arrayCopy);
      case 'bubble': return getBubbleSortAnimations(arrayCopy);
      default: return [];
    }
  };

  animate = (animations, sortedArray) => {
    const arrayBars = document.getElementsByClassName('array-bar');
    const speed = this.getAnimationSpeed();
  
    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];
      const [type, index1, index2] = animation;
  
      setTimeout(() => {
        if (type === 'compare' || type === 'revert') {
          const color = type === 'compare' ? SECONDARY_COLOR : PRIMARY_COLOR;
          const barOne = arrayBars[index1];
          const barTwo = arrayBars[index2];
          if (barOne) barOne.style.backgroundColor = color;
          if (barTwo) barTwo.style.backgroundColor = color;
        } else if (type === 'swap') {
          const bar = arrayBars[index1];
          if (bar) bar.style.height = `${index2}px`;
        }
      }, i * speed);
    }
  
    setTimeout(() => {
      // Set all bars gold after sorting
      for (let bar of arrayBars) {
        bar.style.backgroundColor = '#FFD700'; // gold color
      }
  
      // Update the state array with the sorted one
      this.setState({ array: sortedArray, sorting: false, selectedAlgorithm: null });
    }, animations.length * speed + 100);
  };
  

  mergeSort = () => {
    const arrayCopy = this.state.array.slice();
    const animations = getMergeSortAnimations(arrayCopy);
    this.animate(animations);
  
    const animationDuration = animations.length * this.getAnimationSpeed();
    setTimeout(() => {
      // arrayCopy is sorted now because getMergeSortAnimations sorts the arrayCopy as a side effect
      this.setState({ array: arrayCopy });
    }, animationDuration);
  };
  

  quickSort = () => {
    const arrayCopy = this.state.array.slice();
    const animations = getQuickSortAnimations(arrayCopy);
    this.animate(animations);
  
    const animationDuration = animations.length * this.getAnimationSpeed();
    setTimeout(() => {
      this.setState({ array: arrayCopy });
    }, animationDuration);
  };
  
  heapSort = () => {
    const arrayCopy = this.state.array.slice();
    const animations = getHeapSortAnimations(arrayCopy);
    this.animate(animations);
  
    const animationDuration = animations.length * this.getAnimationSpeed();
    setTimeout(() => {
      this.setState({ array: arrayCopy });
    }, animationDuration);
  };

  bubbleSort = () => {
    const arrayCopy = this.state.array.slice();
    const animations = getBubbleSortAnimations(arrayCopy);
    this.animate(animations);
  
    const animationDuration = animations.length * this.getAnimationSpeed();
    setTimeout(() => {
      this.setState({ array: arrayCopy }); // arrayCopy is sorted now
    }, animationDuration);
  };
  
  render() {
    const { array, arraySize, selectedAlgorithm, sorting } = this.state;
    
    // Max width for bars, min width to avoid too thin bars on big arrays
    const maxBarWidth = 15;
    const minBarWidth = 3;
    // Calculate width by dividing viewport width minus padding by array size,
    // but clamp between min and max widths
    const availableWidth = window.innerWidth - 40; // padding from container
    let barWidth = Math.floor(availableWidth / arraySize) - 2;
    barWidth = Math.min(maxBarWidth, Math.max(minBarWidth, barWidth));
  
    return (
      <div className="array-container">
        {array.map((value, idx) => (
          <div
            className="array-bar"
            key={idx}
            style={{
              height: `${value}px`,
              width: `${barWidth}px`,
            }}
          />
        ))}
  
        <Navbar
          onGenerate={this.resetArray}
          onSizeChange={this.handleSizeChange}
          size={arraySize}
          onSelectAlgorithm={this.setAlgorithm}
          selectedAlgorithm={selectedAlgorithm}
          onStartSort={this.startSort}
          sorting={sorting}
        />
      </div>
    );
  }
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function arraysAreEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}
