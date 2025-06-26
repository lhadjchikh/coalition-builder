# Homepage Management Guide

This guide covers how to manage your organization's homepage content through the Django admin interface, including setting up the homepage configuration and managing content blocks.

!!! warning "Legal Notice"
Organizations using Coalition Builder for advocacy activities should consult legal counsel to ensure compliance with applicable laws, including campaign finance, lobbying, privacy, and accessibility requirements.

## Overview

Coalition Builder provides a flexible homepage management system that allows you to:

- Configure organization information and branding
- Manage hero section content
- Create and organize content blocks
- Control visibility and ordering of sections
- Customize call-to-action sections

## Accessing Homepage Management

1. **Log into Django Admin**:

   - Navigate to `http://your-domain.com/admin/`
   - Log in with your administrator credentials

2. **Navigate to Homepage Management**:
   - Look for the "Core" section in the admin interface
   - Click on "Homepage configurations" to manage overall settings
   - Click on "Content blocks" to manage individual content sections

## Homepage Configuration

### Basic Organization Setup

In the Homepage Configuration section, you'll find fields for:

**Organization Information**:

- **Organization Name**: Your organization's full name
- **Tagline**: A brief, memorable slogan or mission statement
- **Contact Email**: Primary contact email displayed on the homepage
- **Contact Phone**: Primary phone number (optional)

**Hero Section**:

- **Hero Title**: Main headline visitors see first
- **Hero Subtitle**: Supporting text that elaborates on your mission
- **Hero Background Image**: Large background image for the hero section

**About Section**:

- **About Section Title**: Heading for your organization's description
- **About Section Content**: Rich text content describing your organization

**Call-to-Action (CTA)**:

- **CTA Title**: Compelling headline to encourage action
- **CTA Content**: Brief description of what users should do
- **CTA Button Text**: Text for the action button (e.g., "Get Involved")
- **CTA Button URL**: Where the button should link to

**Social Media Links**:

- **Facebook URL**: Link to your Facebook page
- **Twitter URL**: Link to your Twitter/X account
- **LinkedIn URL**: Link to your LinkedIn page

### Campaign Section Settings

**Campaigns Display**:

- **Campaigns Section Title**: Heading for your campaigns section
- **Campaigns Section Subtitle**: Brief description of your campaigns
- **Show Campaigns Section**: Toggle to show/hide the entire campaigns section

### Homepage Activation

**Important**: Only one homepage configuration can be active at a time.

- **Is Active**: Check this box to make this configuration live
- When you activate a new configuration, any previously active one is automatically deactivated

## Content Blocks Management

Content blocks are flexible sections that appear on your homepage in addition to the standard sections.

### Content Block Types

Coalition Builder supports several content block types:

1. **Text**: Rich text content with formatting
2. **Image**: Single image with optional caption
3. **Text + Image**: Combined text and image layout
4. **Quote**: Highlighted quotations or testimonials
5. **Statistics**: Numerical data with descriptions
6. **Custom HTML**: Advanced users can add custom HTML content

### Creating Content Blocks

1. **Navigate to Content Blocks**:

   - In Django admin, go to "Content blocks" under the Core section

2. **Add New Content Block**:

   - Click "Add content block"
   - Choose your block type from the dropdown

3. **Fill in Content**:

   - **Title**: Heading for this section
   - **Content**: Main content (varies by block type)
   - **Order**: Numerical position (lower numbers appear first)
   - **Is Visible**: Toggle to show/hide this block

4. **Save and Continue**:
   - Click "Save" to create the block
   - Use "Save and add another" to create multiple blocks quickly

### Organizing Content Blocks

**Ordering**: Content blocks are displayed in ascending order by their "Order" field:

- Order 1 appears first
- Order 2 appears second
- And so on...

**Best Practices**:

- Leave gaps between order numbers (1, 10, 20) to make reordering easier
- Use consistent ordering increments
- Review the homepage after reordering to ensure proper display

### Content Block Examples

**Text Block Example**:

```
Title: "Why Coalition Building Matters"
Block Type: Text
Content: <p>Effective policy change requires bringing together diverse voices...</p>
Order: 10
Is Visible: ✓
```

**Statistics Block Example**:

```
Title: "Our Impact"
Block Type: Statistics
Content: "500+ Stakeholders Engaged, 12 Bills Passed, 3 States Active"
Order: 20
Is Visible: ✓
```

## Managing Images

### Image Upload

When adding images to content blocks or hero sections:

1. **File Requirements**:

   - Supported formats: JPEG, PNG, WebP
   - Recommended maximum size: 2MB
   - Optimal dimensions vary by use case

2. **Hero Images**:

   - Recommended size: 1920x1080 pixels or similar wide aspect ratio
   - Should work well with text overlay

3. **Content Block Images**:
   - Recommended size: 800x600 pixels or similar
   - Should be optimized for web display

### Image Best Practices

- **Use descriptive filenames** before uploading
- **Optimize images** for web before uploading to improve page load speed
- **Consider accessibility** - ensure sufficient contrast for text overlays
- **Test on mobile** - verify images display well on small screens

## Preview and Publishing

### Previewing Changes

1. **Save your changes** in the Django admin
2. **Visit your homepage** in a new browser tab
3. **Review the display** and ensure content appears as expected
4. **Check mobile responsiveness** by resizing your browser window

### Publishing Workflow

Changes take effect immediately when you save them. For important updates:

1. **Make changes during low-traffic periods** when possible
2. **Test thoroughly** before publishing major updates
3. **Have a backup plan** - know how to quickly revert changes if needed

## Content Guidelines

### Writing Effective Content

**Homepage Content Should Be**:

- **Clear and concise** - visitors should quickly understand your mission
- **Action-oriented** - encourage visitors to get involved
- **Regularly updated** - keep campaigns and information current
- **Mobile-friendly** - readable on all device sizes

**Avoid**:

- **Overly technical language** that might confuse visitors
- **Too much text** in any single section
- **Outdated information** that could mislead visitors
- **Broken links** in CTAs or content blocks

### SEO Considerations

- **Use descriptive titles** that include relevant keywords
- **Write compelling meta descriptions** (handled in hero subtitle)
- **Ensure fast loading** by optimizing images
- **Include relevant keywords** naturally in your content

## Troubleshooting

### Common Issues

**Content not appearing**:

- Check that "Is Visible" is checked for content blocks
- Verify that homepage configuration "Is Active" is checked
- Clear browser cache and refresh

**Images not displaying**:

- Ensure image file size is under 2MB
- Check that file format is supported (JPEG, PNG, WebP)
- Verify file permissions if hosting images separately

**Layout problems**:

- Check content block ordering
- Ensure HTML content is properly formatted
- Test on different screen sizes

### Getting Help

If you encounter issues with homepage management:

1. **Check this documentation** first
2. **Review Django admin error messages** carefully
3. **Test with simple content** to isolate problems
4. **Contact your system administrator** for technical issues

## Advanced Features

### Custom HTML Blocks

For users comfortable with HTML:

1. **Choose "Custom HTML" block type**
2. **Write clean, semantic HTML**
3. **Test thoroughly** across different devices
4. **Avoid inline styles** when possible - use CSS classes instead

### Integration with Campaigns

The homepage automatically displays your active campaigns when:

- "Show Campaigns Section" is enabled in homepage configuration
- You have active campaigns in your system
- The campaigns section will update automatically as you add/remove campaigns

This guide covers the essential aspects of homepage management. For more advanced customization or technical questions, consult your system administrator or developer.
