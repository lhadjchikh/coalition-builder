// Shared Tailwind CSS configuration base
// This file contains the common configuration that can be extended by both frontend and SSR

module.exports = {
  content: [
    // This will be overridden by each implementation
  ],
  theme: {
    extend: {
      colors: {
        // CSS variables that will be populated by the theme system
        "theme-primary": "var(--theme-primary, #2563eb)",
        "theme-primary-light": "var(--theme-primary-light, #3b82f6)",
        "theme-primary-dark": "var(--theme-primary-dark, #1d4ed8)",
        "theme-secondary": "var(--theme-secondary, #64748b)",
        "theme-secondary-light": "var(--theme-secondary-light, #94a3b8)",
        "theme-secondary-dark": "var(--theme-secondary-dark, #475569)",
        "theme-accent": "var(--theme-accent, #f59e0b)",
        "theme-accent-light": "var(--theme-accent-light, #fbbf24)",
        "theme-accent-dark": "var(--theme-accent-dark, #d97706)",
        "theme-accent-darker": "var(--theme-accent-darker, #92400e)",

        // Background colors
        "theme-bg": "var(--theme-bg, #ffffff)",
        "theme-bg-section": "var(--theme-bg-section, #f8fafc)",
        "theme-bg-card": "var(--theme-bg-card, #ffffff)",

        // Text colors
        "theme-text-heading": "var(--theme-text-heading, #1f2937)",
        "theme-text-body": "var(--theme-text-body, #374151)",
        "theme-text-muted": "var(--theme-text-muted, #6b7280)",
        "theme-text-link": "var(--theme-text-link, #2563eb)",
        "theme-text-link-hover": "var(--theme-text-link-hover, #1d4ed8)",

        // Semantic colors
        "theme-success": "var(--theme-success, #10b981)",
        "theme-warning": "var(--theme-warning, #f59e0b)",
        "theme-error": "var(--theme-error, #ef4444)",
        "theme-info": "var(--theme-info, #3b82f6)",
      },
      fontFamily: {
        "theme-heading":
          'var(--theme-font-heading, ui-serif, Georgia, Cambria, "Times New Roman", Times, serif)',
        "theme-body":
          'var(--theme-font-body, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif)',
      },
      fontSize: {
        "theme-base": "var(--theme-font-size-base, 1rem)",
        "theme-small": "var(--theme-font-size-small, 0.875rem)",
        "theme-large": "var(--theme-font-size-large, 1.125rem)",
      },
      maxWidth: {
        reading: "65ch",
        "reading-lg": "75ch",
        "prose-container": "65ch",
      },
    },
  },
  plugins: [],
};
