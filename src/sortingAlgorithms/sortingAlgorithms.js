// sortingAlgorithms.js

export function getSortedArray(array) {
  return array.sort((a, b) => a - b);
}

export function getMergeSortAnimations(array) {
  const animations = [];
  if (array.length <= 1) return animations;
  const auxiliaryArray = array.slice();
  mergeSortHelper(array, 0, array.length - 1, auxiliaryArray, animations);
  return animations;
}

function mergeSortHelper(mainArray, startIdx, endIdx, auxiliaryArray, animations) {
  if (startIdx === endIdx) return;
  const middleIdx = Math.floor((startIdx + endIdx) / 2);
  mergeSortHelper(auxiliaryArray, startIdx, middleIdx, mainArray, animations);
  mergeSortHelper(auxiliaryArray, middleIdx + 1, endIdx, mainArray, animations);
  doMerge(mainArray, startIdx, middleIdx, endIdx, auxiliaryArray, animations);
}

function doMerge(mainArray, startIdx, middleIdx, endIdx, auxiliaryArray, animations) {
  let k = startIdx;
  let i = startIdx;
  let j = middleIdx + 1;

  while (i <= middleIdx && j <= endIdx) {
    animations.push(['compare', i, j]);
    animations.push(['revert', i, j]);
    if (auxiliaryArray[i] <= auxiliaryArray[j]) {
      animations.push(['swap', k, auxiliaryArray[i]]);
      mainArray[k++] = auxiliaryArray[i++];
    } else {
      animations.push(['swap', k, auxiliaryArray[j]]);
      mainArray[k++] = auxiliaryArray[j++];
    }
  }

  while (i <= middleIdx) {
    animations.push(['compare', i, i]);
    animations.push(['revert', i, i]);
    animations.push(['swap', k, auxiliaryArray[i]]);
    mainArray[k++] = auxiliaryArray[i++];
  }

  while (j <= endIdx) {
    animations.push(['compare', j, j]);
    animations.push(['revert', j, j]);
    animations.push(['swap', k, auxiliaryArray[j]]);
    mainArray[k++] = auxiliaryArray[j++];
  }
}

export function getQuickSortAnimations(array) {
  const animations = [];
  if (array.length <= 1) return animations;
  quickSortHelper(array, 0, array.length - 1, animations);
  return animations;
}

function quickSortHelper(array, low, high, animations) {
  if (low < high) {
    const pivotIndex = partition(array, low, high, animations);
    quickSortHelper(array, low, pivotIndex - 1, animations);
    quickSortHelper(array, pivotIndex + 1, high, animations);
  }
}

function partition(array, low, high, animations) {
  const pivot = array[high];
  let i = low;

  for (let j = low; j < high; j++) {
    animations.push(['compare', j, high]);
    animations.push(['revert', j, high]);
    if (array[j] < pivot) {
      animations.push(['swap', i, array[j]]);
      animations.push(['swap', j, array[i]]);
      [array[i], array[j]] = [array[j], array[i]];
      i++;
    }
  }

  animations.push(['swap', i, array[high]]);
  animations.push(['swap', high, array[i]]);
  [array[i], array[high]] = [array[high], array[i]];

  return i;
}

export function getHeapSortAnimations(array) {
  const animations = [];
  const n = array.length;

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(array, n, i, animations);
  }

  for (let i = n - 1; i > 0; i--) {
    animations.push(['swap', 0, array[i]]);
    animations.push(['swap', i, array[0]]);
    [array[0], array[i]] = [array[i], array[0]];
    heapify(array, i, 0, animations);
  }

  return animations;
}

function heapify(array, n, i, animations) {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  if (left < n) {
    animations.push(['compare', left, largest]);
    animations.push(['revert', left, largest]);
    if (array[left] > array[largest]) {
      largest = left;
    }
  }

  if (right < n) {
    animations.push(['compare', right, largest]);
    animations.push(['revert', right, largest]);
    if (array[right] > array[largest]) {
      largest = right;
    }
  }

  if (largest !== i) {
    animations.push(['swap', i, array[largest]]);
    animations.push(['swap', largest, array[i]]);
    [array[i], array[largest]] = [array[largest], array[i]];
    heapify(array, n, largest, animations);
  }
}

export function getBubbleSortAnimations(array) {
  const animations = [];
  const n = array.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      animations.push(['compare', j, j + 1]);
      animations.push(['revert', j, j + 1]);
      if (array[j] > array[j + 1]) {
        animations.push(['swap', j, array[j + 1]]);
        animations.push(['swap', j + 1, array[j]]);
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
      }
    }
  }

  return animations;
}
