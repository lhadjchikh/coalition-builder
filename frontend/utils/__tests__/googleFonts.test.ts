import { loadGoogleFonts } from '../googleFonts';

// Mock console methods to avoid cluttering test output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

// Mock webfontloader
const mockWebFontLoad = jest.fn();
const mockWebFontLoader = {
  default: {
    load: mockWebFontLoad,
  },
  load: mockWebFontLoad,
};

// Mock dynamic import
const mockDynamicImport = jest.fn();
global.Function = jest.fn().mockImplementation((param, body) => {
  if (body === 'return import(moduleName)') {
    return mockDynamicImport;
  }
  return jest.requireActual('Function')(param, body);
});

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;

// Mock document and window
Object.defineProperty(window, 'document', {
  value: {
    body: {
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
      },
    },
  },
  writable: true,
});

describe('loadGoogleFonts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDynamicImport.mockResolvedValue(mockWebFontLoader);
    mockSetTimeout.mockImplementation((callback, delay) => {
      // Store callback for manual execution if needed
      (mockSetTimeout as any).lastCallback = callback;
      return delay as any; // Return delay as mock timeout ID
    });
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  it('should return early when no fonts provided', () => {
    loadGoogleFonts([]);
    expect(mockDynamicImport).not.toHaveBeenCalled();
  });

  it('should return early when fonts array is null/undefined', () => {
    loadGoogleFonts(null as any);
    expect(mockDynamicImport).not.toHaveBeenCalled();
    
    loadGoogleFonts(undefined as any);
    expect(mockDynamicImport).not.toHaveBeenCalled();
  });

  it('should return early in non-browser environment', () => {
    const originalWindow = global.window;
    delete (global as any).window;

    loadGoogleFonts(['Roboto']);
    expect(mockDynamicImport).not.toHaveBeenCalled();

    global.window = originalWindow;
  });

  it('should load single font with proper formatting', async () => {
    const fonts = ['Roboto'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockDynamicImport).toHaveBeenCalledWith('webfontloader');
    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: ['Roboto:400,500,600,700'],
      },
      timeout: 3000,
      loading: expect.any(Function),
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it('should load multiple fonts with proper formatting', async () => {
    const fonts = ['Roboto', 'Open Sans', 'Lato'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: [
          'Roboto:400,500,600,700',
          'Open Sans:400,500,600,700',
          'Lato:400,500,600,700'
        ],
      },
      timeout: 3000,
      loading: expect.any(Function),
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it('should filter out empty and whitespace-only font names', async () => {
    const fonts = ['Roboto', '', '   ', 'Open Sans', '\t\n', 'Lato'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: [
          'Roboto:400,500,600,700',
          'Open Sans:400,500,600,700',
          'Lato:400,500,600,700'
        ],
      },
      timeout: 3000,
      loading: expect.any(Function),
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it('should trim font names', async () => {
    const fonts = ['  Roboto  ', '\tOpen Sans\n', ' Lato '];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: [
          'Roboto:400,500,600,700',
          'Open Sans:400,500,600,700',
          'Lato:400,500,600,700'
        ],
      },
      timeout: 3000,
      loading: expect.any(Function),
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it('should add loading class to body when loading starts', async () => {
    const fonts = ['Roboto'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.body.classList.add).toHaveBeenCalledWith('fonts-loading');
  });

  it('should set fallback timeout', async () => {
    const fonts = ['Roboto'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
  });

  it('should handle loading callback correctly', async () => {
    const fonts = ['Roboto'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    const loadingCallback = mockWebFontLoad.mock.calls[0][0].loading;
    loadingCallback();

    expect(document.body.classList.add).toHaveBeenCalledWith('fonts-loading');
  });

  it('should handle active callback correctly', async () => {
    const fonts = ['Roboto'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    const activeCallback = mockWebFontLoad.mock.calls[0][0].active;
    activeCallback();

    expect(mockConsoleLog).toHaveBeenCalledWith('Google Fonts loaded successfully');
    expect(mockClearTimeout).toHaveBeenCalled();
    expect(document.body.classList.remove).toHaveBeenCalledWith('fonts-loading');
    expect(document.body.classList.add).toHaveBeenCalledWith('fonts-loaded');
  });

  it('should handle inactive callback correctly', async () => {
    const fonts = ['Roboto'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    const inactiveCallback = mockWebFontLoad.mock.calls[0][0].inactive;
    inactiveCallback();

    expect(mockConsoleWarn).toHaveBeenCalledWith('Google Fonts failed to load or timed out');
    expect(mockClearTimeout).toHaveBeenCalled();
    expect(document.body.classList.remove).toHaveBeenCalledWith('fonts-loading');
    expect(document.body.classList.add).toHaveBeenCalledWith('fonts-loaded');
  });

  it('should handle fallback timeout execution', async () => {
    const fonts = ['Roboto'];
    
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Execute the fallback timeout callback
    const timeoutCallback = (mockSetTimeout as any).lastCallback;
    timeoutCallback();

    expect(document.body.classList.remove).toHaveBeenCalledWith('fonts-loading');
    expect(document.body.classList.add).toHaveBeenCalledWith('fonts-loaded');
  });

  it('should use cached webfontloader on subsequent calls', async () => {
    // First call
    loadGoogleFonts(['Roboto']);
    await new Promise(resolve => setTimeout(resolve, 0));

    // Second call
    loadGoogleFonts(['Open Sans']);
    await new Promise(resolve => setTimeout(resolve, 0));

    // Dynamic import should only be called once
    expect(mockDynamicImport).toHaveBeenCalledTimes(1);
    expect(mockWebFontLoad).toHaveBeenCalledTimes(2);
  });

  it('should handle webfontloader import failure', async () => {
    mockDynamicImport.mockRejectedValueOnce(new Error('Module not found'));
    
    const fonts = ['Roboto'];
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockConsoleWarn).toHaveBeenCalledWith('Failed to load webfontloader:', expect.any(Error));
    expect(mockClearTimeout).toHaveBeenCalled();
    expect(document.body.classList.remove).toHaveBeenCalledWith('fonts-loading');
    expect(document.body.classList.add).toHaveBeenCalledWith('fonts-loaded');
  });

  it('should handle webfontloader with default export', async () => {
    const mockLoaderWithDefault = {
      default: {
        load: mockWebFontLoad,
      },
    };
    mockDynamicImport.mockResolvedValueOnce(mockLoaderWithDefault);

    const fonts = ['Roboto'];
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWebFontLoad).toHaveBeenCalled();
  });

  it('should handle webfontloader without default export', async () => {
    const mockLoaderWithoutDefault = {
      load: mockWebFontLoad,
    };
    mockDynamicImport.mockResolvedValueOnce(mockLoaderWithoutDefault);

    const fonts = ['Roboto'];
    loadGoogleFonts(fonts);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWebFontLoad).toHaveBeenCalled();
  });

  it('should handle exception during webfont loading setup', async () => {
    const fonts = ['Roboto'];
    
    // Mock a failure after successful import
    mockWebFontLoad.mockImplementationOnce(() => {
      throw new Error('WebFont load error');
    });

    loadGoogleFonts(fonts);

    // Wait for async operations and error handling
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockConsoleWarn).toHaveBeenCalledWith('Failed to load webfontloader:', expect.any(Error));
  });

  it('should handle general try-catch error', () => {
    // Mock Function constructor to throw error
    global.Function = jest.fn().mockImplementation(() => {
      throw new Error('Function constructor error');
    });

    const fonts = ['Roboto'];
    loadGoogleFonts(fonts);

    expect(mockConsoleWarn).toHaveBeenCalledWith('Webfontloader not available:', expect.any(Error));
  });
});