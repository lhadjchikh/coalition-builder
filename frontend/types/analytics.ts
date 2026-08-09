/**
 * Shared type definitions for Google Analytics integration
 */

// Type definitions for Google Analytics gtag function
export interface GtagCommand {
  (command: "config", targetId: string, config?: Record<string, unknown>): void;
  (
    command: "event",
    eventName: string,
    eventParameters?: Record<string, unknown>
  ): void;
  (command: "js", date: Date): void;
}

// Analytics event interface
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// Page view event interface
export interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
}
