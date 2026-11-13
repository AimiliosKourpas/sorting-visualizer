// Every algorithm here records a list of small, reversible steps instead of
// just sorting. The visualizer plays those steps forwards or backwards.
//
// Step shapes:
//   { t: 'c', i, j }        compare positions i and j
//   { t: 's', i, j }        swap positions i and j
//   { t: 'w', i, v, old }   write value v at position i (old is what was there)
//   { t: 'r', i }           read position i (no comparison)
//   { t: 'm', i }           position i now holds its final value
//   { t: 'n' }              explanation only
// Every step also has `note` (the explanation), `l` (pseudocode line), and
// optionally `r` ([lo, hi] range being worked on) and `p` (pivot / key index).

export const MAX_VALUE = 500;

function recorder(a) {
  const steps = [];
  const ctx = { range: null, pivot: null };
  const push = (step) => {
    if (ctx.range) step.r = ctx.range;
    if (ctx.pivot !== null) step.p = ctx.pivot;
    steps.push(step);
  };
  return {
    steps,
    ctx,
    note(note, l) {
      push({ t: 'n', note, l });
    },
    read(i, note, l) {
      push({ t: 'r', i, note, l });
    },
    cmp(i, j, note, l) {
      push({ t: 'c', i, j, note, l });
    },
    swap(i, j, note, l) {
      push({ t: 's', i, j, note, l });
      [a[i], a[j]] = [a[j], a[i]];
    },
    write(i, v, note, l) {
      push({ t: 'w', i, v, old: a[i], note, l });
      a[i] = v;
    },
    mark(i, note, l) {
      push({ t: 'm', i, note, l });
    },
  };
}

// ---- Playback engine ------------------------------------------------------

export function createEngine(array) {
  return {
    arr: array.slice(),
    marks: new Array(array.length).fill(0),
    cursor: 0,
    comps: 0,
    writes: 0,
  };
}

export function applyStep(e, s) {
  const { arr } = e;
  switch (s.t) {
    case 'c':
      e.comps++;
      break;
    case 's':
      [arr[s.i], arr[s.j]] = [arr[s.j], arr[s.i]];
      e.writes += 2;
      break;
    case 'w':
      arr[s.i] = s.v;
      e.writes++;
      break;
    case 'm':
      e.marks[s.i]++;
      break;
    default:
      break;
  }
  e.cursor++;
}

export function undoStep(e, s) {
  const { arr } = e;
  switch (s.t) {
    case 'c':
      e.comps--;
      break;
    case 's':
      [arr[s.i], arr[s.j]] = [arr[s.j], arr[s.i]];
      e.writes -= 2;
      break;
    case 'w':
      arr[s.i] = s.old;
      e.writes--;
      break;
    case 'm':
      e.marks[s.i]--;
      break;
    default:
      break;
  }
  e.cursor--;
}

export function seek(e, trace, target) {
  while (e.cursor < target) applyStep(e, trace[e.cursor]);
  while (e.cursor > target) undoStep(e, trace[e.cursor - 1]);
}

// ---- Algorithms -----------------------------------------------------------

function bubbleSort(a) {
  const rec = recorder(a);
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    rec.ctx.range = [0, n - 1 - i];
    for (let j = 0; j < n - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        rec.cmp(j, j + 1, `${a[j]} > ${a[j + 1]}, so they are out of order.`, 2);
        rec.swap(j, j + 1, `Swap ${a[j]} and ${a[j + 1]}.`, 3);
        swapped = true;
      } else {
        rec.cmp(j, j + 1, `${a[j]} ≤ ${a[j + 1]}, already in order. Move on.`, 2);
      }
    }
    rec.mark(n - 1 - i, `${a[n - 1 - i]} has bubbled up to its final position.`, 4);
    if (!swapped) {
      for (let k = n - 2 - i; k >= 0; k--) {
        rec.mark(k, 'A full pass made no swaps, so everything left is already sorted.', 5);
      }
      return rec.steps;
    }
  }
  rec.mark(0, 'Only one item is left, so it is in place too.', 4);
  return rec.steps;
}

function cocktailSort(a) {
  const rec = recorder(a);
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi) {
    let swapped = false;
    rec.ctx.range = [lo, hi];
    for (let j = lo; j < hi; j++) {
      if (a[j] > a[j + 1]) {
        rec.cmp(j, j + 1, `Going right: ${a[j]} > ${a[j + 1]}, out of order.`, 2);
        rec.swap(j, j + 1, `Swap ${a[j]} and ${a[j + 1]}.`, 2);
        swapped = true;
      } else {
        rec.cmp(j, j + 1, `Going right: ${a[j]} ≤ ${a[j + 1]}, in order.`, 2);
      }
    }
    rec.mark(hi, `${a[hi]} is the largest left, now in its final position.`, 1);
    hi--;
    if (!swapped || lo >= hi) break;

    swapped = false;
    rec.ctx.range = [lo, hi];
    for (let j = hi; j > lo; j--) {
      if (a[j - 1] > a[j]) {
        rec.cmp(j - 1, j, `Going left: ${a[j - 1]} > ${a[j]}, out of order.`, 4);
        rec.swap(j - 1, j, `Swap ${a[j - 1]} and ${a[j]}.`, 4);
        swapped = true;
      } else {
        rec.cmp(j - 1, j, `Going left: ${a[j - 1]} ≤ ${a[j]}, in order.`, 4);
      }
    }
    rec.mark(lo, `${a[lo]} is the smallest left, now in its final position.`, 3);
    lo++;
    if (!swapped) break;
  }
  for (let k = lo; k <= hi; k++) {
    rec.mark(k, 'No swaps were needed, so the middle is already sorted.', 5);
  }
  return rec.steps;
}

function selectionSort(a) {
  const rec = recorder(a);
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    rec.ctx.range = [i, n - 1];
    rec.ctx.pivot = min;
    rec.note(`Look for the smallest value from position ${i} onward. Start with ${a[i]}.`, 1);
    for (let j = i + 1; j < n; j++) {
      if (a[j] < a[min]) {
        rec.cmp(j, min, `${a[j]} < ${a[min]}, so ${a[j]} is the new smallest.`, 3);
        min = j;
        rec.ctx.pivot = min;
      } else {
        rec.cmp(j, min, `${a[j]} is not smaller than ${a[min]}. Keep ${a[min]}.`, 3);
      }
    }
    rec.ctx.pivot = null;
    if (min !== i) {
      rec.swap(i, min, `Smallest is ${a[min]}. Swap it into position ${i}.`, 4);
    }
    rec.mark(i, `${a[i]} is in its final position.`, 4);
  }
  rec.mark(n - 1, 'The last item left must be the largest.', 4);
  return rec.steps;
}

function insertionSort(a) {
  const rec = recorder(a);
  const n = a.length;
  for (let i = 1; i < n; i++) {
    rec.ctx.range = [0, i];
    rec.note(`Take ${a[i]} and slide it left into the sorted part.`, 1);
    let j = i;
    while (j > 0) {
      rec.ctx.pivot = j;
      if (a[j - 1] > a[j]) {
        rec.cmp(j - 1, j, `${a[j - 1]} > ${a[j]}, so ${a[j]} needs to move left.`, 2);
        rec.swap(j - 1, j, `Swap ${a[j - 1]} and ${a[j]}.`, 3);
        j--;
      } else {
        rec.cmp(j - 1, j, `${a[j - 1]} ≤ ${a[j]}, so ${a[j]} has found its spot.`, 2);
        break;
      }
    }
    rec.ctx.pivot = null;
  }
  return rec.steps;
}

function shellSort(a) {
  const rec = recorder(a);
  const n = a.length;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    rec.note(
      gap === 1
        ? 'Gap is 1: a final insertion sort on an almost-sorted array.'
        : `Gap is ${gap}: compare items that are ${gap} positions apart.`,
      1
    );
    for (let i = gap; i < n; i++) {
      let j = i;
      while (j >= gap) {
        rec.ctx.pivot = j;
        if (a[j - gap] > a[j]) {
          rec.cmp(j - gap, j, `${a[j - gap]} > ${a[j]} (gap ${gap}), out of order.`, 4);
          rec.swap(j - gap, j, `Swap ${a[j - gap]} and ${a[j]}.`, 5);
          j -= gap;
        } else {
          rec.cmp(j - gap, j, `${a[j - gap]} ≤ ${a[j]} (gap ${gap}), in order.`, 4);
          break;
        }
      }
      rec.ctx.pivot = null;
    }
  }
  return rec.steps;
}

function mergeSort(a) {
  const rec = recorder(a);

  const sort = (lo, hi) => {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    rec.ctx.range = [lo, hi];
    rec.note(`Split positions ${lo}–${hi} into ${lo}–${mid} and ${mid + 1}–${hi}.`, 1);
    sort(lo, mid);
    sort(mid + 1, hi);

    rec.ctx.range = [lo, hi];
    const tmp = a.slice(lo, hi + 1);
    let i = lo;
    let j = mid + 1;
    let k = lo;
    while (i <= mid && j <= hi) {
      const left = tmp[i - lo];
      const right = tmp[j - lo];
      if (left <= right) {
        rec.cmp(i, j, `Fronts of the two halves: ${left} ≤ ${right}. Take ${left}.`, 3);
        rec.write(k++, left, `Place ${left} next in the merged run.`, 4);
        i++;
      } else {
        rec.cmp(i, j, `Fronts of the two halves: ${left} > ${right}. Take ${right}.`, 3);
        rec.write(k++, right, `Place ${right} next in the merged run.`, 4);
        j++;
      }
    }
    while (i <= mid) {
      rec.write(k++, tmp[i - lo], `Right half is empty. Copy ${tmp[i - lo]} over.`, 5);
      i++;
    }
    while (j <= hi) {
      rec.write(k++, tmp[j - lo], `Left half is empty. Copy ${tmp[j - lo]} over.`, 5);
      j++;
    }
  };

  sort(0, a.length - 1);
  return rec.steps;
}

function quickSort(a) {
  const rec = recorder(a);

  const sort = (lo, hi) => {
    if (lo > hi) return;
    if (lo === hi) {
      rec.ctx.range = [lo, hi];
      rec.mark(lo, `A single item (${a[lo]}) is already in its final position.`, 0);
      return;
    }
    rec.ctx.range = [lo, hi];
    rec.ctx.pivot = hi;
    const pivot = a[hi];
    rec.note(`Pick the last item, ${pivot}, as the pivot for positions ${lo}–${hi}.`, 1);
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (a[j] < pivot) {
        rec.cmp(j, hi, `${a[j]} < pivot ${pivot}, so it belongs on the left side.`, 3);
        if (i !== j) rec.swap(i, j, `Move ${a[j]} to the left side (position ${i}).`, 3);
        i++;
      } else {
        rec.cmp(j, hi, `${a[j]} ≥ pivot ${pivot}, so it stays on the right side.`, 3);
      }
    }
    if (i !== hi) {
      rec.swap(i, hi, `Put the pivot ${pivot} between the two sides.`, 4);
    }
    rec.ctx.pivot = null;
    rec.mark(i, `Pivot ${pivot} is in its final position. Smaller left, larger right.`, 4);
    sort(lo, i - 1);
    sort(i + 1, hi);
  };

  sort(0, a.length - 1);
  return rec.steps;
}

function heapSort(a) {
  const rec = recorder(a);
  const n = a.length;

  const siftDown = (start, size, line) => {
    let i = start;
    while (true) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < size) {
        const bigger = a[left] > a[largest];
        rec.cmp(
          left,
          largest,
          `Parent ${a[i]} vs left child ${a[left]}: ${bigger ? 'child is larger' : 'parent is fine'}.`,
          line
        );
        if (bigger) largest = left;
      }
      if (right < size) {
        const bigger = a[right] > a[largest];
        rec.cmp(
          right,
          largest,
          `Right child ${a[right]} vs ${a[largest]}: ${bigger ? 'right child is the largest' : 'no change'}.`,
          line
        );
        if (bigger) largest = right;
      }
      if (largest === i) return;
      rec.swap(i, largest, `Move the larger child ${a[largest]} up, push ${a[i]} down.`, line);
      i = largest;
    }
  };

  rec.note('First, rearrange the array into a max-heap: every parent ≥ its children.', 0);
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    siftDown(i, n, 0);
  }
  for (let end = n - 1; end > 0; end--) {
    rec.ctx.range = [0, end];
    rec.swap(0, end, `The heap's top, ${a[0]}, is the largest left. Move it to the end.`, 2);
    rec.mark(end, `${a[end]} is in its final position.`, 2);
    rec.ctx.range = [0, end - 1];
    siftDown(0, end, 3);
  }
  rec.ctx.range = null;
  rec.mark(0, 'The last item left is the smallest.', 2);
  return rec.steps;
}

function radixSort(a) {
  const rec = recorder(a);
  const n = a.length;
  const max = Math.max(...a);
  const names = ['ones', 'tens', 'hundreds', 'thousands'];
  let pass = 0;
  for (let exp = 1; Math.floor(max / exp) >= 1; exp *= 10, pass++) {
    const name = names[pass] || `10^${pass}`;
    const digit = (v) => Math.floor(v / exp) % 10;
    rec.note(`Pass ${pass + 1}: group every value by its ${name} digit. No comparisons needed.`, 0);

    const count = new Array(10).fill(0);
    for (let i = 0; i < n; i++) {
      rec.read(i, `${a[i]} has ${name} digit ${digit(a[i])}.`, 1);
      count[digit(a[i])]++;
    }
    for (let d = 1; d < 10; d++) count[d] += count[d - 1];
    rec.note('Work out where each digit group starts, keeping the earlier order inside a group.', 2);

    const out = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      out[--count[digit(a[i])]] = a[i];
    }
    for (let k = 0; k < n; k++) {
      rec.write(k, out[k], `${name} digit ${digit(out[k])}: place ${out[k]} at position ${k}.`, 3);
    }
  }
  return rec.steps;
}

// ---- Catalogue ------------------------------------------------------------

export const ALGORITHMS = {
  bubble: {
    name: 'Bubble Sort',
    short: 'Bubble',
    blurb:
      'Walks through the array again and again, swapping neighbours that are out of order. Each pass pushes the largest remaining value to the end.',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    code: [
      'repeat for each pass:',
      '  for j from start to last unsorted:',
      '    if a[j] > a[j+1]:',
      '      swap a[j] and a[j+1]',
      '  the last unsorted item is now final',
      '  if no swaps happened: stop',
    ],
    run: bubbleSort,
  },
  cocktail: {
    name: 'Cocktail Shaker Sort',
    short: 'Cocktail',
    blurb:
      'Bubble sort that alternates direction: one pass carries the largest value right, the next carries the smallest value left.',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    code: [
      'repeat until no swaps:',
      '  pass right, largest ends up last',
      '    if a[j] > a[j+1]: swap them',
      '  pass left, smallest ends up first',
      '    if a[j-1] > a[j]: swap them',
      'whatever is left is sorted',
    ],
    run: cocktailSort,
  },
  selection: {
    name: 'Selection Sort',
    short: 'Selection',
    blurb:
      'Finds the smallest value in the unsorted part and swaps it to the front. Many comparisons, but very few writes.',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
    code: [
      'for i from 0 to n-2:',
      '  min = i',
      '  for j from i+1 to n-1:',
      '    if a[j] < a[min]: min = j',
      '  swap a[i] and a[min]',
    ],
    run: selectionSort,
  },
  insertion: {
    name: 'Insertion Sort',
    short: 'Insertion',
    blurb:
      'Grows a sorted section on the left, taking the next value and sliding it left until it fits. Very fast on nearly sorted data.',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    code: [
      'for i from 1 to n-1:',
      '  j = i',
      '  while j > 0 and a[j-1] > a[j]:',
      '    swap a[j-1] and a[j]',
      '    j = j - 1',
    ],
    run: insertionSort,
  },
  shell: {
    name: 'Shell Sort',
    short: 'Shell',
    blurb:
      'Insertion sort over items a "gap" apart. The gap shrinks each round, so values travel long distances early and little at the end.',
    best: 'O(n log n)',
    average: '~O(n^1.5)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
    code: [
      'gap = n / 2',
      'while gap > 0:',
      '  for i from gap to n-1:',
      '    j = i',
      '    while j ≥ gap and a[j-gap] > a[j]:',
      '      swap a[j-gap] and a[j]; j = j - gap',
      '  gap = gap / 2',
    ],
    run: shellSort,
  },
  merge: {
    name: 'Merge Sort',
    short: 'Merge',
    blurb:
      'Splits the array in half, sorts each half, then merges the two sorted halves by repeatedly taking the smaller front value.',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    code: [
      'mergeSort(lo, hi):',
      '  mid = (lo + hi) / 2',
      '  mergeSort(lo, mid); mergeSort(mid+1, hi)',
      '  while both halves have items:',
      '    take the smaller front item',
      '  copy whatever is left over',
    ],
    run: mergeSort,
  },
  quick: {
    name: 'Quick Sort',
    short: 'Quick',
    blurb:
      'Picks a pivot, moves smaller values to its left and larger to its right, then does the same on each side. Slow on already sorted input with this pivot choice.',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: false,
    code: [
      'quickSort(lo, hi):',
      '  pivot = a[hi]; i = lo',
      '  for j from lo to hi-1:',
      '    if a[j] < pivot: swap a[i], a[j]; i++',
      '  swap a[i] and a[hi]',
      '  quickSort(lo, i-1); quickSort(i+1, hi)',
    ],
    run: quickSort,
  },
  heap: {
    name: 'Heap Sort',
    short: 'Heap',
    blurb:
      'Arranges the array as a max-heap, then repeatedly moves the top (largest) value to the end and repairs the heap.',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    stable: false,
    code: [
      'build a max-heap (parent ≥ children)',
      'for end from n-1 down to 1:',
      '  swap a[0] and a[end]',
      '  sift a[0] down to repair the heap',
    ],
    run: heapSort,
  },
  radix: {
    name: 'Radix Sort (LSD)',
    short: 'Radix',
    blurb:
      'Never compares two values. It groups numbers by their ones digit, then tens, then hundreds, keeping the previous order inside each group.',
    best: 'O(d·n)',
    average: 'O(d·n)',
    worst: 'O(d·n)',
    space: 'O(n)',
    stable: true,
    code: [
      'for each digit, from ones upward:',
      '  count how many values have each digit',
      '  work out where each digit group starts',
      '  write values back in digit order',
    ],
    run: radixSort,
  },
};

export const ALGORITHM_KEYS = Object.keys(ALGORITHMS);

// ---- Starting arrays ------------------------------------------------------

export const PRESETS = {
  random: 'Random',
  nearly: 'Nearly sorted',
  reversed: 'Reversed',
  few: 'Few unique',
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function makeArray(size, preset) {
  const random = () => randomInt(10, MAX_VALUE);
  let array;
  if (preset === 'few') {
    const pool = Array.from({ length: 5 }, (_, i) => Math.round(((i + 1) * MAX_VALUE) / 5));
    array = Array.from({ length: size }, () => pool[randomInt(0, pool.length - 1)]);
  } else {
    array = Array.from({ length: size }, random);
  }
  if (preset === 'nearly' || preset === 'reversed') {
    array.sort((x, y) => x - y);
  }
  if (preset === 'reversed') array.reverse();
  if (preset === 'nearly') {
    const swaps = Math.max(1, Math.round(size * 0.05));
    for (let s = 0; s < swaps; s++) {
      const i = randomInt(0, size - 1);
      const j = Math.min(size - 1, Math.max(0, i + randomInt(-4, 4)));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  return array;
}
