// Setup file for API tests to ensure consistent mocking

export const setupAPITests = () => {
  // Ensure window is defined for CSRF handling
  if (typeof window === 'undefined') {
    (global as any).window = {};
  }
  
  // Ensure document.cookie is available
  if (typeof document === 'undefined') {
    (global as any).document = { cookie: '' };
  } else {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  }
  
  // Mock fetch globally
  if (!global.fetch || !(global.fetch as any).mock) {
    global.fetch = jest.fn();
  }
  
  return {
    mockFetch: global.fetch as jest.Mock,
    resetMocks: () => {
      (global.fetch as jest.Mock).mockClear();
      if (global.document) {
        global.document.cookie = '';
      }
    },
  };
};