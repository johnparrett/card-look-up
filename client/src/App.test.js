import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({
      psaPrice: '45.00',
      ebayPrice: '50.00',
      urls: { psaLink: 'https://psa.example', ebayLink: 'https://ebay.example' },
      comments: ''
    })
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('lookup flow and export to CSV', async () => {
  render(<App />);
  const input = screen.getByPlaceholderText(/e.g. 1998 Topps/i);
  fireEvent.change(input, { target: { value: '1998 Topps Ken Griffey Jr. #34 - PSA 6' } });
  fireEvent.click(screen.getByText('Lookup'));

  await waitFor(() => expect(screen.getByText('45.00')).toBeInTheDocument());
  // Ensure URL.createObjectURL exists in this environment so we can spy on it
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = jest.fn();
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = jest.fn();
  }
  const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
  fireEvent.click(screen.getByText('Export CSV'));
  expect(createObjectURLSpy).toHaveBeenCalled();
});
