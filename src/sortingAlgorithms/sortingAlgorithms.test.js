import {
  ALGORITHMS,
  ALGORITHM_KEYS,
  PRESETS,
  makeArray,
  createEngine,
  seek,
} from './sortingAlgorithms';

const inputs = [
  [42],
  [2, 1],
  [5, 5, 5, 5],
  [1, 2, 3, 4, 5, 6],
  [9, 8, 7, 6, 5, 4, 3, 2, 1],
  ...Object.keys(PRESETS).flatMap((preset) => [makeArray(10, preset), makeArray(200, preset)]),
];

describe.each(ALGORITHM_KEYS)('%s sort', (key) => {
  test.each(inputs.map((input) => [input.length, input]))(
    'replays to a sorted array and rewinds to the original (n=%i)',
    (_, input) => {
      const expected = input.slice().sort((x, y) => x - y);
      const trace = ALGORITHMS[key].run(input.slice());
      const engine = createEngine(input);

      seek(engine, trace, trace.length);
      expect(engine.arr).toEqual(expected);

      seek(engine, trace, 0);
      expect(engine.arr).toEqual(input);
      expect(engine.comps).toBe(0);
      expect(engine.writes).toBe(0);
      expect(engine.marks.every((m) => m === 0)).toBe(true);
    }
  );

  test('every step has an explanation and a valid pseudocode line', () => {
    const { run, code } = ALGORITHMS[key];
    const trace = run(makeArray(40, 'random'));
    for (const step of trace) {
      expect(typeof step.note).toBe('string');
      expect(step.l).toBeGreaterThanOrEqual(0);
      expect(step.l).toBeLessThan(code.length);
    }
  });
});
