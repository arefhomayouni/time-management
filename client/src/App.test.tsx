import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the landing hero', () => {
  render(<App />);
  // The hero headline renders one <span> per word for the kinetic reveal, so
  // match the whole heading (whose textContent is normalised) rather than a
  // single text node.
  const headline = screen.getByRole('heading', { level: 1 });
  expect(headline).toHaveTextContent(/Log the hours/i);
});

test('renders exactly one top-level heading', () => {
  render(<App />);
  // The mobile app bar carries a contextual title, but it must stay a <span>:
  // a second <h1> would split the document outline and confuse screen readers
  // (and this assertion is what caught that regression).
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
});

test('hides the signed-in tab bar from visitors', () => {
  render(<App />);
  // Every tab requires an account, so showing the bar signed out would only
  // bounce people to /login and cover the marketing footer.
  expect(screen.queryByRole('navigation', { name: /menu/i })).toBeNull();
});

