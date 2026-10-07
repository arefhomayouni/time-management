import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the landing hero', () => {
  render(<App />);
  const headline = screen.getByText(/Log the hours/i);
  expect(headline).toBeInTheDocument();
});
