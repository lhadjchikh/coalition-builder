// Jest setup file
// Add custom jest matchers from jest-dom
import "@testing-library/jest-dom";

// Polyfill TextEncoder/TextDecoder for JSDOM
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
