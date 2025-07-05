# Theme Management

Coalition Builder includes a comprehensive theme system that allows you to customize the visual appearance of your platform to match your organization's branding. This guide covers how to create, configure, and manage themes.

## Overview

The theme system provides:

- **Brand Colors**: Primary, secondary, and accent colors with automatic variations
- **Typography**: Custom font families and sizing
- **Background Colors**: Customizable section and card backgrounds
- **Text Colors**: Heading, body, muted, and link colors
- **Brand Assets**: Logo and favicon upload
- **Custom CSS**: Advanced customization options

## Accessing Theme Management

Themes can be managed through multiple interfaces:

### Django Admin Interface

1. Log in to the Django admin at `/admin/`
2. Navigate to **Core** → **Themes**
3. Create, edit, or activate themes

### API Endpoints

For programmatic access, use the REST API:

- `GET /api/theme/` - List all themes
- `GET /api/theme/active/` - Get the currently active theme
- `POST /api/theme/` - Create a new theme
- `PUT /api/theme/{id}/` - Update a theme
- `PATCH /api/theme/{id}/activate/` - Activate a theme
- `DELETE /api/theme/{id}/` - Delete a theme

## Creating a New Theme

### Basic Information

1. **Name**: A descriptive name for your theme (e.g., "Organization Brand 2024")
2. **Description**: Optional description for internal reference
3. **Active Status**: Only one theme can be active at a time

### Brand Colors

Configure your organization's primary brand colors:

- **Primary Color**: Main brand color (buttons, links, highlights)
- **Secondary Color**: Supporting color for secondary elements
- **Accent Color**: Accent color for special elements

The system automatically generates light and dark variations of each color for hover states and depth.

#### Color Format

All colors must be provided in hex format:

- 6-digit hex: `#2563eb`
- 3-digit hex: `#25e` (expanded to `#2255ee`)

### Background Colors

Customize the appearance of different page sections:

- **Background Color**: Main page background (usually white or light)
- **Section Background Color**: Alternate sections (hero, call-to-action areas)
- **Card Background Color**: Content cards and panels

### Text Colors

Define text colors for different content types:

- **Heading Color**: All headings (h1-h6)
- **Body Text Color**: Main content text
- **Muted Text Color**: Secondary text (captions, metadata)
- **Link Color**: Default link color
- **Link Hover Color**: Color when hovering over links

### Typography

Configure font families and sizing:

- **Heading Font Family**: Font for all headings
- **Body Font Family**: Font for body text
- **Font Size Base**: Base font size (default: 1.0rem)
- **Font Size Small**: Small text size (default: 0.875rem)
- **Font Size Large**: Large text size (default: 1.125rem)

#### Font Family Examples

Common font family configurations:

```css
/* System fonts (recommended for performance) */
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

/* Google Fonts example */
"Inter", ui-sans-serif, system-ui, sans-serif

/* Serif fonts */
"Georgia", "Times New Roman", serif
```

### Brand Assets

Upload your organization's visual assets:

- **Logo**: Upload your main organization logo (automatically stored in S3)
- **Logo Alt Text**: Accessibility description for the logo
- **Favicon**: Upload favicon image (automatically stored in S3)

#### Supported Image Formats

- **JPEG** (.jpg, .jpeg) - Recommended for photos and complex images
- **PNG** (.png) - Recommended for logos with transparency
- **WebP** (.webp) - Modern format with excellent compression
- **GIF** (.gif) - For simple graphics or animations

#### File Requirements

- **Logo**: Recommended size 200x80px to 400x160px for optimal display
- **Favicon**: Recommended size 32x32px or 64x64px
- **File Size**: Maximum 5MB per file
- **Quality**: High-resolution images are automatically optimized for web delivery

### Custom CSS

For advanced customization, add custom CSS rules that will be injected into all pages:

```css
/* Example: Custom button styles */
.btn-custom {
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Example: Custom animations */
.hero-section {
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Activating a Theme

Only one theme can be active at a time. When you activate a new theme:

1. The previously active theme is automatically deactivated
2. The new theme becomes immediately visible across the platform
3. CSS variables are regenerated with the new theme values

### Via Django Admin

1. Go to the theme list in Django admin
2. Click on the theme you want to activate
3. Check the "Is active" checkbox
4. Save the theme

### Via API

Send a PATCH request to activate a theme:

```bash
curl -X PATCH /api/theme/1/activate/
```

## Theme CSS Generation

The theme system automatically generates CSS variables that can be used throughout the application:

```css
:root {
  --theme-primary: #2563eb;
  --theme-primary-light: #3b82f6;
  --theme-primary-dark: #1d4ed8;

  --theme-bg: #ffffff;
  --theme-bg-section: #f9fafb;
  --theme-text-heading: #111827;
  /* ... and many more */
}
```

### Using Theme Variables

You can reference these variables in custom CSS:

```css
.custom-component {
  background-color: var(--theme-primary);
  color: var(--theme-bg);
  border: 1px solid var(--theme-primary-light);
}
```

## Best Practices

### Color Selection

1. **Accessibility**: Ensure sufficient contrast between text and background colors
2. **Brand Consistency**: Use your organization's official brand colors
3. **Color Harmony**: Choose colors that work well together across different combinations

### Typography

1. **Readability**: Select fonts that are easy to read at different sizes
2. **Performance**: Prefer system fonts or limit custom font variations
3. **Consistency**: Use a maximum of 2-3 font families

### Testing

1. **Multiple Devices**: Test your theme on desktop, tablet, and mobile
2. **Different Content**: Check how colors work with various content types
3. **Accessibility Tools**: Use tools to verify color contrast ratios

## Troubleshooting

### Theme Not Applying

1. Check that the theme is marked as active
2. Clear browser cache and reload the page
3. Verify there are no CSS syntax errors in custom CSS

### Color Issues

1. Ensure hex color format is correct (`#` prefix, valid hex characters)
2. Test color combinations for sufficient contrast
3. Check that colors work in both light and dark contexts

### Font Loading Issues

1. Verify font URLs are accessible
2. Include proper fallback fonts in font-family declarations
3. Test loading on different network conditions

## Advanced Usage

### Programmatic Theme Management

For automated theme management, use the API:

```python
import requests

# Create a new theme
theme_data = {
    "name": "Summer Campaign 2024",
    "primary_color": "#ff6b35",
    "secondary_color": "#4ecdc4",
    "background_color": "#ffffff"
}

response = requests.post("/api/theme/", json=theme_data)
theme_id = response.json()["id"]

# Activate the theme
requests.patch(f"/api/theme/{theme_id}/activate/")
```

### Theme Inheritance

When creating a new theme, consider copying values from an existing theme and modifying only what's needed:

1. Export an existing theme's data via API
2. Modify the colors or other properties
3. Create the new theme with the updated data

This ensures consistency while allowing for seasonal or campaign-specific variations.
