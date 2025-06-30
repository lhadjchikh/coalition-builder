import React from 'react';
import { render, act } from '@testing-library/react';

// Utility function to wait for all async operations to complete
export const waitForAsyncUpdates = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

// Utility to properly mock API calls with act() wrapper
export const mockAPICall = async <T,>(
  mockFn: jest.MockedFunction<any>,
  returnValue: T,
  shouldReject = false
) => {
  if (shouldReject) {
    mockFn.mockRejectedValueOnce(returnValue);
  } else {
    mockFn.mockResolvedValueOnce(returnValue);
  }
  await waitForAsyncUpdates();
};

// Enhanced render function that waits for initial async operations
export const renderWithAsyncUpdates = async (ui: React.ReactElement) => {
  const result = render(ui);
  await waitForAsyncUpdates();
  return result;
};

// Utility to resolve promises in tests with proper act() wrapping
export const resolvePromiseInTest = async <T,>(resolveFunction: (value: T) => void, value: T) => {
  await act(async () => {
    resolveFunction(value);
  });
};

// Utility to reject promises in tests with proper act() wrapping
export const rejectPromiseInTest = async (rejectFunction: (reason: any) => void, reason: any) => {
  await act(async () => {
    rejectFunction(reason);
  });
};
