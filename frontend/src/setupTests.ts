// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for react-router-dom in test environment
if (typeof global !== 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = global.TextEncoder || TextEncoder;
  global.TextDecoder = global.TextDecoder || TextDecoder;
}

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ detail: 'Not found' }),
  })
) as jest.Mock;

// Configure React Testing Library to be more lenient with act() warnings
import { configure } from '@testing-library/react';

configure({
  // Increase timeout for async operations
  asyncUtilTimeout: 5000,
});

// Helper to reset mocks
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
  // Reset fetch to return 404 by default (no active theme)
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Not found' }),
    })
  );
});
