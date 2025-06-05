import React from 'react';
import {
  getMergeSortAnimations,
  getQuickSortAnimations,
  getHeapSortAnimations,
  getBubbleSortAnimations,
  getSortedArray, // <-- new helper
} from '../sortingAlgorithms/sortingAlgorithms.js';
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
    };
  }

  componentDidMount() {
    this.resetArray();
  }

  handleSizeChange = (event) => {
    const newSize = Number(event.target.value);
    this.setState({ arraySize: newSize }, () => this.resetArray());
  };

  resetArray() {
    const array = [];
    for (let i = 0; i < this.state.arraySize; i++) {
      array.push(randomIntFromInterval(5, 730));
    }
    this.setState({ array });
  }

  getAnimationSpeed() {
    const { arraySize } = this.state;
    return Math.max(1, Math.min(100, Math.floor(300 / arraySize)));
  }

  animate(animations) {
    const arrayBars = document.getElementsByClassName('array-bar');
    const speed = this.getAnimationSpeed();
  
    for (let i = 0; i < animations.length; i++) {
      const [action, idx1, idx2] = animations[i];
  
      setTimeout(() => {
        if (action === 'compare') {
          const barOne = arrayBars[idx1];
          const barTwo = arrayBars[idx2];
          barOne.style.backgroundColor = SECONDARY_COLOR;
          barTwo.style.backgroundColor = SECONDARY_COLOR;
        } else if (action === 'revert') {
          const barOne = arrayBars[idx1];
          const barTwo = arrayBars[idx2];
          barOne.style.backgroundColor = PRIMARY_COLOR;
          barTwo.style.backgroundColor = PRIMARY_COLOR;
        } else if (action === 'swap') {
          const bar = arrayBars[idx1];
          bar.style.height = `${idx2}px`;
        }
      }, i * speed);
    }
  
    // Mark sorted at end
    setTimeout(() => {
      for (let bar of arrayBars) {
        bar.style.backgroundColor = 'green';
      }
    }, animations.length * speed + speed);
  }
  
  
  

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
  

  testSortingAlgorithms = () => {
    for (let i = 0; i < 100; i++) {
      const array = [];
      const length = randomIntFromInterval(1, 100);
      for (let j = 0; j < length; j++) {
        array.push(randomIntFromInterval(-1000, 1000));
      }

      const jsSorted = array.slice().sort((a, b) => a - b);
      const mergeSorted = getSortedArray(array.slice());
      console.log(arraysAreEqual(jsSorted, mergeSorted));
    }
  };

  render() {
    const { array } = this.state;
    const barWidth = Math.max(2, Math.floor(window.innerWidth / this.state.arraySize)) - 2;
    
    return (
      <div className="array-container">
        {array.map((value, idx) => (
          <div
            className="array-bar"
            key={idx}
            style={{
              backgroundColor: PRIMARY_COLOR,
              height: `${value}px`,
              width: `${barWidth}px`,
              display: 'inline-block',
              margin: '0 1px',
            }}></div>
        ))}
        <Navbar
          onGenerate={() => this.resetArray()}
          onMerge={this.mergeSort}
          onQuick={this.quickSort}
          onHeap={this.heapSort}
          onBubble={this.bubbleSort}
          size={this.state.arraySize}
          onSizeChange={this.handleSizeChange}
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
