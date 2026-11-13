import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  ALGORITHMS,
  PRESETS,
  MAX_VALUE,
  makeArray,
  createEngine,
  applyStep,
  seek,
} from '../sortingAlgorithms/sortingAlgorithms';
import './SortingVisualizer.css';
import Navbar from '../components/Navbar';

const MIN_SIZE = 10;
const DEFAULT_SIZE = 100;
const LABEL_LIMIT = 30; // show the numbers on the bars up to this many bars
const FAST_STEPS_PER_SECOND = 20; // above this, bar transitions are turned off

const maxSize = () => (window.innerWidth <= 768 ? 100 : 200);

// Slider position (1–100) to steps per second (2–3000), on a curve.
const stepsPerSecond = (speed) => 2 * Math.pow(1500, (speed - 1) / 99);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const number = (key, fallback, min, max) => {
    const value = parseInt(q.get(key), 10);
    return Number.isFinite(value) ? clamp(value, min, max) : fallback;
  };
  return {
    algo: ALGORITHMS[q.get('algo')] ? q.get('algo') : 'bubble',
    preset: PRESETS[q.get('preset')] ? q.get('preset') : 'random',
    size: number('size', Math.min(DEFAULT_SIZE, maxSize()), MIN_SIZE, maxSize()),
    speed: number('speed', 50, 1, 100),
  };
}

function buildSession(size, preset, algo) {
  const initial = makeArray(size, preset);
  return { initial, trace: ALGORITHMS[algo].run(initial.slice()) };
}

export default function SortingVisualizer() {
  const [settings, setSettings] = useState(readUrl);
  const { algo, preset, size, speed } = settings;
  const [session, setSession] = useState(() => buildSession(size, preset, algo));
  const { initial, trace } = session;
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, redraw] = useReducer((n) => n + 1, 0);

  const engineRef = useRef(null);
  if (!engineRef.current) engineRef.current = createEngine(initial);
  const engine = engineRef.current;

  const speedRef = useRef(speed);
  speedRef.current = speed;
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const audioRef = useRef(null);

  const done = engine.cursor === trace.length;
  const lastStep = engine.cursor > 0 ? trace[engine.cursor - 1] : null;

  // ---- Sound --------------------------------------------------------------

  const beep = useCallback((step) => {
    const ctx = audioRef.current;
    if (!soundRef.current || !ctx || !step || step.i === undefined) return;
    const value = engineRef.current.arr[step.i];
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 150 + (value / MAX_VALUE) * 900;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioRef.current = new AudioCtx();
    }
    audioRef.current.resume();
    setSound((on) => !on);
  };

  // ---- Session changes ----------------------------------------------------

  const load = (nextSession) => {
    engineRef.current = createEngine(nextSession.initial);
    setPlaying(false);
    setSession(nextSession);
  };

  const generate = (overrides = {}) => {
    if (playing) return;
    const next = { ...settings, ...overrides };
    setSettings(next);
    load(buildSession(next.size, next.preset, next.algo));
  };

  const selectAlgorithm = (key) => {
    setSettings({ ...settings, algo: key });
    load({ initial, trace: ALGORITHMS[key].run(initial.slice()) });
  };

  const setSpeed = (value) => setSettings((s) => ({ ...s, speed: value }));

  // ---- Playback -----------------------------------------------------------

  const moveTo = useCallback(
    (target) => {
      const e = engineRef.current;
      seek(e, trace, clamp(target, 0, trace.length));
      beep(trace[e.cursor - 1]);
      redraw();
    },
    [trace, beep]
  );

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (engineRef.current.cursor === trace.length) moveTo(0);
    setPlaying(true);
  }, [trace, playing, moveTo]);

  const stepBy = useCallback(
    (delta) => {
      setPlaying(false);
      moveTo(engineRef.current.cursor + delta);
    },
    [moveTo]
  );

  const reset = useCallback(() => {
    setPlaying(false);
    moveTo(0);
  }, [moveTo]);

  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    let last = performance.now();
    let budget = 0;
    const tick = (now) => {
      const e = engineRef.current;
      budget += (Math.min(now - last, 100) / 1000) * stepsPerSecond(speedRef.current);
      last = now;
      const count = Math.floor(budget);
      if (count > 0) {
        budget -= count;
        const end = Math.min(trace.length, e.cursor + count);
        while (e.cursor < end) applyStep(e, trace[e.cursor]);
        beep(trace[e.cursor - 1]);
        redraw();
        if (e.cursor >= trace.length) {
          setPlaying(false);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, trace, beep]);

  // Keyboard: space = play/pause, arrows = step, R = reset.
  useEffect(() => {
    const onKey = (event) => {
      if (/^(INPUT|SELECT|BUTTON|TEXTAREA)$/.test(event.target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === ' ') {
        event.preventDefault();
        togglePlay();
      } else if (event.key === 'ArrowRight') {
        stepBy(1);
      } else if (event.key === 'ArrowLeft') {
        stepBy(-1);
      } else if (event.key === 'r' || event.key === 'R') {
        reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, stepBy, reset]);

  // Keep the address bar in sync so the current setup can be shared as a link.
  useEffect(() => {
    const q = new URLSearchParams();
    q.set('algo', algo);
    q.set('size', size);
    q.set('preset', preset);
    q.set('speed', speed);
    window.history.replaceState(null, '', `${window.location.pathname}?${q}`);
  }, [algo, size, preset, speed]);

  const copyLink = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ---- Render -------------------------------------------------------------

  const info = ALGORITHMS[algo];
  const showLabels = initial.length <= LABEL_LIMIT;
  const fast = playing && stepsPerSecond(speed) > FAST_STEPS_PER_SECOND;
  const atStart = engine.cursor === 0;

  const barClass = (idx) => {
    if (done) return 'array-bar sorted';
    let cls = 'array-bar';
    const s = lastStep;
    if (s) {
      const touched = idx === s.i || idx === s.j;
      if (touched && (s.t === 's' || s.t === 'w')) cls += ' write';
      else if (idx === s.p) cls += ' pivot';
      else if (touched && (s.t === 'c' || s.t === 'r')) cls += ' compare';
      else if (engine.marks[idx] > 0) cls += ' sorted';
      if (s.r && (idx < s.r[0] || idx > s.r[1]) && engine.marks[idx] === 0) cls += ' dim';
    }
    return cls;
  };

  let now;
  if (done) {
    now = `Sorted! ${initial.length} items took ${engine.comps.toLocaleString()} comparisons and ${engine.writes.toLocaleString()} writes.`;
  } else if (lastStep) {
    now = lastStep.note;
  } else {
    now = 'Press Play to watch it run, or step through it one move at a time.';
  }

  const playLabel = playing ? 'Pause' : done ? 'Replay' : 'Play';

  return (
    <div className="visualizer">
      <Navbar selectedAlgorithm={algo} onSelectAlgorithm={selectAlgorithm} />

      <main className="page">
        <section className="card stage">
          <div className="toolbar">
            <button className="btn" onClick={() => generate()} disabled={playing}>
              <Icon name="shuffle" />
              New array
            </button>

            <label className="field">
              <span>Size</span>
              <input
                type="range"
                min={MIN_SIZE}
                max={maxSize()}
                value={size}
                disabled={playing}
                onChange={(event) => generate({ size: Number(event.target.value) })}
              />
              <output>{size}</output>
            </label>

            <label className="field">
              <span>Start as</span>
              <select
                value={preset}
                disabled={playing}
                onChange={(event) => generate({ preset: event.target.value })}
              >
                {Object.entries(PRESETS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>

            <label className="field push">
              <span>Speed</span>
              <input
                type="range"
                min="1"
                max="100"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
            </label>

            <button
              className={`btn icon${sound ? ' on' : ''}`}
              onClick={toggleSound}
              aria-pressed={sound}
              aria-label="Sound"
              title={sound ? 'Sound on' : 'Sound off'}
            >
              <Icon name={sound ? 'soundOn' : 'soundOff'} />
            </button>
          </div>

          <div
            className={`array-container${fast ? ' fast' : ''}${showLabels ? ' labelled' : ''}`}
            role="img"
            aria-label={`Bar chart of ${initial.length} values being sorted with ${info.name}`}
          >
            {engine.arr.map((value, idx) => (
              <div
                className={barClass(idx)}
                key={idx}
                style={{ height: `${(value / MAX_VALUE) * 100}%` }}
              >
                {showLabels && <span>{value}</span>}
              </div>
            ))}
          </div>

          <p className={`now${done ? ' done' : ''}`} aria-live="polite">{now}</p>

          <div className="transport">
            <button className="btn icon" onClick={reset} disabled={atStart} aria-label="Reset" title="Reset (R)">
              <Icon name="reset" />
            </button>
            <button className="btn icon" onClick={() => stepBy(-1)} disabled={atStart} aria-label="Step back" title="Step back (←)">
              <Icon name="back" />
            </button>
            <button className="btn play" onClick={togglePlay} title={`${playLabel} (Space)`}>
              <Icon name={playing ? 'pause' : done ? 'reset' : 'play'} />
              {playLabel}
            </button>
            <button className="btn icon" onClick={() => stepBy(1)} disabled={done} aria-label="Step forward" title="Step forward (→)">
              <Icon name="forward" />
            </button>
            <input
              type="range"
              className="scrubber"
              min="0"
              max={Math.max(1, trace.length)}
              value={engine.cursor}
              onChange={(event) => stepBy(Number(event.target.value) - engine.cursor)}
              aria-label="Position in the sort"
            />
            <span className="counter">
              <b>{engine.cursor.toLocaleString()}</b> / {trace.length.toLocaleString()}
            </span>
          </div>

          <ul className="legend">
            <li><i className="swatch compare" />Comparing</li>
            <li><i className="swatch write" />Moving</li>
            <li><i className="swatch pivot" />Pivot / key</li>
            <li><i className="swatch sorted" />In final place</li>
            <li className="keys"><kbd>Space</kbd> play <kbd>←</kbd> <kbd>→</kbd> step <kbd>R</kbd> reset</li>
          </ul>
        </section>

        <div className="lesson">
          <section className="card about">
            <div className="about-head">
              <h1>{info.name}</h1>
              <button className="btn small" onClick={copyLink}>
                {copied ? 'Link copied' : 'Copy link'}
              </button>
            </div>
            <p className="blurb">{info.blurb}</p>

            <dl className="facts">
              <div className="live"><dt>Comparisons</dt><dd>{engine.comps.toLocaleString()}</dd></div>
              <div className="live"><dt>Writes</dt><dd>{engine.writes.toLocaleString()}</dd></div>
              <div><dt>Best case</dt><dd>{info.best}</dd></div>
              <div><dt>Average</dt><dd>{info.average}</dd></div>
              <div><dt>Worst case</dt><dd>{info.worst}</dd></div>
              <div><dt>Extra memory</dt><dd>{info.space}</dd></div>
              <div><dt>Stable</dt><dd>{info.stable ? 'Yes' : 'No'}</dd></div>
            </dl>
          </section>

          <section className="card code-card">
            <h2>Pseudocode</h2>
            <ol className="code">
              {info.code.map((line, idx) => (
                <li key={idx} className={!done && lastStep && lastStep.l === idx ? 'active' : ''}>
                  {line}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}

const ICONS = {
  play: <path d="M8 5v14l11-7z" />,
  pause: <path d="M6 5h4v14H6zM14 5h4v14h-4z" />,
  back: <path d="M6 6h2v12H6zM20 6v12l-10-6z" />,
  forward: <path d="M16 6h2v12h-2zM4 6l10 6-10 6z" />,
  reset: <path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />,
  shuffle: (
    <path d="M10.6 9.2 5.4 4 4 5.4l5.2 5.2zM14.5 4l2 2L4 18.6 5.4 20 18 7.5l2 2V4zm.3 9.4-1.4 1.4 3.1 3.1-2 2.1H20v-5.5l-2 2z" />
  ),
  soundOn: (
    <path d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
  ),
  soundOff: (
    <path d="M3 9v6h4l5 5V4L7 9zm18.5-.1-1.4-1.4L17.5 10l-2.6-2.5-1.4 1.4L16 11.5 13.5 14l1.4 1.4 2.6-2.5 2.6 2.5 1.4-1.4-2.5-2.5z" />
  ),
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
