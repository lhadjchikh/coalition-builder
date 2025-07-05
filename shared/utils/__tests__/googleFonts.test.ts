// Mock webfontloader
const mockWebFontLoad = jest.fn();
jest.mock("webfontloader", () => ({
  load: mockWebFontLoad,
}));

import { loadGoogleFonts } from "../googleFonts";

// Mock console methods
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation();

describe("loadGoogleFonts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  it("should not load fonts when array is empty", () => {
    loadGoogleFonts([]);

    expect(mockWebFontLoad).not.toHaveBeenCalled();
  });

  it("should not load fonts when array is null/undefined", () => {
    loadGoogleFonts(null as any);
    expect(mockWebFontLoad).not.toHaveBeenCalled();

    loadGoogleFonts(undefined as any);
    expect(mockWebFontLoad).not.toHaveBeenCalled();
  });

  it("should load single Google Font with correct configuration", () => {
    const fonts = ["Roboto"];

    loadGoogleFonts(fonts);

    expect(mockWebFontLoad).toHaveBeenCalledTimes(1);
    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: ["Roboto:400,500,600,700"],
      },
      timeout: 3000,
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it("should load multiple Google Fonts with correct formatting", () => {
    const fonts = ["Merriweather", "Barlow"];

    loadGoogleFonts(fonts);

    expect(mockWebFontLoad).toHaveBeenCalledTimes(1);
    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: ["Merriweather:400,500,600,700", "Barlow:400,500,600,700"],
      },
      timeout: 3000,
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it("should trim whitespace from font family names", () => {
    const fonts = ["  Playfair Display  ", "   Inter   "];

    loadGoogleFonts(fonts);

    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: ["Playfair Display:400,500,600,700", "Inter:400,500,600,700"],
      },
      timeout: 3000,
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it("should handle font families with spaces in names", () => {
    const fonts = ["Open Sans", "Source Sans Pro"];

    loadGoogleFonts(fonts);

    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: [
          "Open Sans:400,500,600,700",
          "Source Sans Pro:400,500,600,700",
        ],
      },
      timeout: 3000,
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it("should call active callback when fonts load successfully", () => {
    const fonts = ["Roboto"];

    loadGoogleFonts(fonts);

    // Get the active callback from the mock call
    const mockCall = mockWebFontLoad.mock.calls[0][0];
    const activeCallback = mockCall.active;

    // Simulate successful font loading
    activeCallback();

    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Google Fonts loaded successfully",
    );
  });

  it("should call inactive callback when fonts fail to load", () => {
    const fonts = ["Roboto"];

    loadGoogleFonts(fonts);

    // Get the inactive callback from the mock call
    const mockCall = mockWebFontLoad.mock.calls[0][0];
    const inactiveCallback = mockCall.inactive;

    // Simulate failed font loading
    inactiveCallback();

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Google Fonts failed to load or timed out",
    );
  });

  it("should use 3 second timeout", () => {
    const fonts = ["Roboto"];

    loadGoogleFonts(fonts);

    const mockCall = mockWebFontLoad.mock.calls[0][0];
    expect(mockCall.timeout).toBe(3000);
  });

  it("should handle complex font family names correctly", () => {
    const fonts = ["Playfair Display", "Source Code Pro", "Noto Sans JP"];

    loadGoogleFonts(fonts);

    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: [
          "Playfair Display:400,500,600,700",
          "Source Code Pro:400,500,600,700",
          "Noto Sans JP:400,500,600,700",
        ],
      },
      timeout: 3000,
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it("should handle duplicate font families", () => {
    const fonts = ["Roboto", "Roboto", "Open Sans"];

    loadGoogleFonts(fonts);

    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: [
          "Roboto:400,500,600,700",
          "Roboto:400,500,600,700",
          "Open Sans:400,500,600,700",
        ],
      },
      timeout: 3000,
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });

  it("should filter out empty strings and whitespace-only font names", () => {
    const fonts = ["Roboto", "", "   ", "Open Sans", "  Inter  "];

    loadGoogleFonts(fonts);

    expect(mockWebFontLoad).toHaveBeenCalledWith({
      google: {
        families: [
          "Roboto:400,500,600,700",
          "Open Sans:400,500,600,700",
          "Inter:400,500,600,700",
        ],
      },
      timeout: 3000,
      active: expect.any(Function),
      inactive: expect.any(Function),
    });
  });
});
