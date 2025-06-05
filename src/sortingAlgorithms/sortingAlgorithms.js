export function getMergeSortAnimations(array) {
    const animations = [];
    if (array.length <= 1) return array;
    const auxiliaryArray = array.slice();
    mergeSortHelper(array, 0, array.length - 1, auxiliaryArray, animations);
    return animations;
  }
  
  function mergeSortHelper(
    mainArray,
    startIdx,
    endIdx,
    auxiliaryArray,
    animations,
  ) {
    if (startIdx === endIdx) return;
    const middleIdx = Math.floor((startIdx + endIdx) / 2);
    mergeSortHelper(auxiliaryArray, startIdx, middleIdx, mainArray, animations);
    mergeSortHelper(auxiliaryArray, middleIdx + 1, endIdx, mainArray, animations);
    doMerge(mainArray, startIdx, middleIdx, endIdx, auxiliaryArray, animations);
  }
  
  function doMerge(
    mainArray,
    startIdx,
    middleIdx,
    endIdx,
    auxiliaryArray,
    animations,
  ) {
    let k = startIdx;
    let i = startIdx;
    let j = middleIdx + 1;
    while (i <= middleIdx && j <= endIdx) {
      // These are the values that we're comparing; we push them once
      // to change their color.
      animations.push([i, j]);
      // These are the values that we're comparing; we push them a second
      // time to revert their color.
      animations.push([i, j]);
      if (auxiliaryArray[i] <= auxiliaryArray[j]) {
        // We overwrite the value at index k in the original array with the
        // value at index i in the auxiliary array.
        animations.push([k, auxiliaryArray[i]]);
        mainArray[k++] = auxiliaryArray[i++];
      } else {
        // We overwrite the value at index k in the original array with the
        // value at index j in the auxiliary array.
        animations.push([k, auxiliaryArray[j]]);
        mainArray[k++] = auxiliaryArray[j++];
      }
    }
    while (i <= middleIdx) {
      // These are the values that we're comparing; we push them once
      // to change their color.
      animations.push([i, i]);
      // These are the values that we're comparing; we push them a second
      // time to revert their color.
      animations.push([i, i]);
      // We overwrite the value at index k in the original array with the
      // value at index i in the auxiliary array.
      animations.push([k, auxiliaryArray[i]]);
      mainArray[k++] = auxiliaryArray[i++];
    }
    while (j <= endIdx) {
      // These are the values that we're comparing; we push them once
      // to change their color.
      animations.push([j, j]);
      // These are the values that we're comparing; we push them a second
      // time to revert their color.
      animations.push([j, j]);
      // We overwrite the value at index k in the original array with the
      // value at index j in the auxiliary array.
      animations.push([k, auxiliaryArray[j]]);
      mainArray[k++] = auxiliaryArray[j++];
    }
  }

  export function getQuickSortAnimations(array) {
    const animations = [];
    if (array.length <= 1) return array;
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
      // Compare
      animations.push([j, high]); // Color change to show comparison
      animations.push([j, high]); // Revert color
  
      if (array[j] < pivot) {
        animations.push([i, array[j]]);
        animations.push([j, array[i]]);
        [array[i], array[j]] = [array[j], array[i]];
        i++;
      } else {
        animations.push([-1, -1]); // No-op for consistency
        animations.push([-1, -1]);
      }
    }
  
    animations.push([i, array[high]]);
    animations.push([high, array[i]]);
    [array[i], array[high]] = [array[high], array[i]];
    return i;
  }
  

  export function getHeapSortAnimations(array) {
    const animations = [];
    const n = array.length;
  
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      heapify(array, n, i, animations);
    }
  
    // Extract elements from heap
    for (let i = n - 1; i > 0; i--) {
      animations.push([0, array[i]]);
      animations.push([i, array[0]]);
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
      animations.push([left, largest]); // Comparison
      animations.push([left, largest]);
      if (array[left] > array[largest]) {
        largest = left;
      }
    }
  
    if (right < n) {
      animations.push([right, largest]); // Comparison
      animations.push([right, largest]);
      if (array[right] > array[largest]) {
        largest = right;
      }
    }
  
    if (largest !== i) {
      animations.push([i, array[largest]]);
      animations.push([largest, array[i]]);
      [array[i], array[largest]] = [array[largest], array[i]];
      heapify(array, n, largest, animations);
    } else {
      animations.push([-1, -1]); // No-op for consistent animation length
      animations.push([-1, -1]);
    }
  }
  