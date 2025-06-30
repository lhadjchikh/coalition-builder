// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

// Configure React Testing Library to be more lenient with act() warnings
import { configure } from '@testing-library/react';

configure({
  // Increase timeout for async operations
  asyncUtilTimeout: 5000,
});

// Helper to reset mocks
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});
