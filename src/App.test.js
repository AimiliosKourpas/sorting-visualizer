import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('selecting an algorithm shows its tutorial and lets you step through it', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Bubble Sort' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Quick' }));
  expect(screen.getByRole('heading', { name: 'Quick Sort' })).toBeInTheDocument();
  expect(screen.getByText(/Press Play/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
  expect(screen.getByText(/as the pivot/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Step back' }));
  expect(screen.getByText(/Press Play/)).toBeInTheDocument();
});
