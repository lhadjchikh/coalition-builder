# Content Management Guide

This comprehensive guide covers all aspects of content management in Coalition Builder, including using the Django admin interface, managing different content types, and best practices for maintaining your organization's digital presence.

## Specialized Guides

For detailed instructions on specific content management tasks, see these focused guides:

- **[Campaign Management](campaign-management.md)** - Create and manage policy advocacy campaigns
- **[Stakeholder Management](stakeholder-management.md)** - Organize and engage with supporters and partners
- **[Homepage Management](homepage-management.md)** - Configure organization branding and homepage content
- **[Theme Management](theme-management.md)** - Customize branding, colors, and visual appearance

## Overview

Coalition Builder provides a powerful content management system that enables you to:

- **Manage dynamic homepage content** with flexible content blocks
- **Create and organize policy campaigns** with rich content
- **Handle stakeholder information** and engagement data
- **Control user access and permissions** across different content areas
- **Maintain media assets** including images, documents, and resources
- **Ensure content quality** through editorial workflows

## Django Admin Interface

### Accessing the Admin Interface

1. **Login Process**:
   - Navigate to `http://your-domain.com/admin/`
   - Enter your username and password
   - Click "Log in" to access the admin dashboard

2. **Admin Dashboard Overview**:
   - **Homepage Management**: Control site-wide homepage settings
   - **Campaigns**: Create and manage policy campaigns
   - **Stakeholders**: Manage organizations and individuals
   - **Endorsements**: Review and approve campaign endorsements
   - **Content Blocks**: Manage homepage content sections
   - **User Management**: Control user access and permissions

### Navigation and Layout

**Main Navigation Sections**:

- **Core**: Homepage configuration and content blocks
- **Campaigns**: Campaign and bill management
- **Stakeholders**: Organization and individual management
- **Endorsements**: Endorsement workflow management
- **Authentication**: User and group management
- **Sites**: Site configuration (advanced)

**Interface Elements**:

- **Add buttons**: Create new content entries
- **Filter sidebar**: Filter content by various criteria
- **Search bar**: Find specific content quickly
- **Breadcrumb navigation**: Track your location in the admin
- **Action dropdown**: Perform bulk operations

## Content Types and Management

### Homepage Content Management

**Homepage Configuration**:

- **Organization Settings**: Name, tagline, contact information
- **Hero Section**: Main banner content and imagery
- **About Section**: Organization description and mission
- **Call-to-Action**: Buttons and links to encourage engagement
- **Social Media Links**: Connect to external social platforms

**Content Blocks**:

- **Text Blocks**: Rich formatted text content
- **Image Blocks**: Photos, graphics, and visual elements
- **Mixed Blocks**: Combination of text and images
- **Quote Blocks**: Highlighted testimonials or statements
- **Statistics Blocks**: Numerical data and metrics
- **Custom HTML**: Advanced formatting and custom elements

### Campaign Content Management

**Campaign Information**:

- **Basic Details**: Title, description, and overview
- **Rich Content**: Detailed campaign information with formatting
- **Status Management**: Control campaign visibility and progression
- **Resource Attachment**: Associate documents, links, and media

**Associated Bills**:

- **Bill Details**: Number, title, and description
- **Legislative Status**: Track progress through legislative process
- **Position Tracking**: Support, oppose, or monitor stance
- **External Links**: Connect to legislative websites and resources

### Stakeholder Content Management

**Organization Profiles**:

- **Basic Information**: Name, type, and contact details
- **Classification**: Categorize by sector, size, and influence
- **Relationship Tracking**: Note partnerships and connections
- **Communication History**: Track interactions and engagement

**Individual Profiles**:

- **Personal Information**: Name, title, and professional background
- **Expertise Areas**: Policy knowledge and specializations
- **Contact Preferences**: Communication methods and frequency
- **Engagement History**: Track participation in campaigns and events

### Endorsement Content Management

**Endorsement Review**:

- **Verification Status**: Confirm email verification completion
- **Content Review**: Assess endorsement statements and information
- **Approval Workflow**: Approve, reject, or request modifications
- **Public Display**: Control which endorsements appear publicly

## Rich Text Editing

### Using the Rich Text Editor

**Formatting Options**:

- **Basic Formatting**: Bold, italic, underline, strikethrough
- **Lists**: Bulleted and numbered lists
- **Links**: Internal and external link creation
- **Images**: Inline image insertion and positioning
- **Tables**: Data tables with formatting options
- **Code**: Code blocks and inline code formatting

**Best Practices for Rich Text**:

- **Use headings consistently** to create clear content hierarchy
- **Keep paragraphs concise** for better readability
- **Use lists** to break up dense information
- **Add links strategically** to provide additional context
- **Optimize images** before insertion to maintain page speed

### HTML and Advanced Formatting

**When to Use Custom HTML**:

- Complex layouts that can't be achieved with rich text editor
- Integration with external services or widgets
- Custom styling for specific design requirements
- Advanced interactive elements

**HTML Best Practices**:

- **Use semantic HTML** elements for accessibility
- **Avoid inline styles** when possible
- **Test across devices** to ensure responsive behavior
- **Validate HTML** to prevent display issues

## Media Management

### Image Management

**Image Guidelines**:

- **File Formats**: JPEG, PNG, WebP for web compatibility
- **File Sizes**: Keep under 2MB for optimal loading speeds
- **Dimensions**: Use appropriate sizes for intended display
- **Compression**: Optimize images without sacrificing quality

**Image Organization**:

- **Descriptive Filenames**: Use clear, descriptive file names
- **Alt Text**: Always include alt text for accessibility
- **Copyright Compliance**: Ensure proper rights to use images
- **Consistent Style**: Maintain visual consistency across site

### Document Management

**Document Types**:

- **PDFs**: Policy documents, fact sheets, reports
- **Word Documents**: Editable templates and drafts
- **Spreadsheets**: Data files and analysis
- **Presentations**: Slide decks and visual materials

**Document Best Practices**:

- **Version Control**: Use clear version numbering
- **Descriptive Names**: Include date and content description
- **Regular Updates**: Keep documents current and relevant
- **Access Control**: Ensure appropriate viewing permissions

## User Management and Permissions

### User Roles and Permissions

**Admin Roles**:

- **Superuser**: Full access to all admin functions
- **Staff User**: Access to admin interface with specific permissions
- **Content Editor**: Can edit content but not user management
- **Moderator**: Can review and approve endorsements

**Permission Levels**:

- **View**: Can see content but not edit
- **Add**: Can create new content entries
- **Change**: Can edit existing content
- **Delete**: Can remove content (use carefully)

### Managing User Access

**Adding New Users**:

1. Navigate to "Users" in the Authentication section
2. Click "Add user" and enter username and password
3. Set user details including name and email
4. Assign appropriate groups and permissions
5. Save the user account

**User Groups**:

- **Content Managers**: Can edit campaigns, stakeholders, and homepage
- **Moderators**: Can review and approve endorsements
- **Viewers**: Read-only access to admin interface
- **Custom Groups**: Create specific permission sets as needed

## Content Workflows

### Editorial Process

**Content Creation Workflow**:

1. **Draft Creation**: Initial content development
2. **Internal Review**: Review by team members or supervisors
3. **Revision Process**: Incorporate feedback and make improvements
4. **Final Approval**: Final sign-off from designated approver
5. **Publication**: Make content live on public website
6. **Maintenance**: Regular updates and quality checks

**Quality Control**:

- **Fact Checking**: Verify accuracy of all information
- **Proofreading**: Check for spelling, grammar, and formatting errors
- **Link Testing**: Ensure all links work properly
- **Mobile Testing**: Verify content displays well on mobile devices
- **Accessibility Review**: Ensure content is accessible to all users

### Publication Management

**Content Visibility Control**:

- **Draft Status**: Keep content private during development
- **Publication Toggle**: Control when content goes live
- **Featured Content**: Highlight important content on homepage
- **Archive System**: Manage old or outdated content

**Scheduling and Planning**:

- **Content Calendar**: Plan content publication schedules
- **Campaign Coordination**: Align content with campaign timelines
- **Event Integration**: Coordinate content with events and activities
- **Regular Maintenance**: Schedule periodic content reviews

## SEO and Discoverability

### Search Engine Optimization

**On-Page SEO**:

- **Page Titles**: Descriptive, keyword-rich page titles
- **Meta Descriptions**: Compelling descriptions for search results
- **Header Structure**: Proper use of H1, H2, H3 tags
- **Internal Linking**: Connect related content across the site
- **Image Alt Text**: Descriptive alt text for all images

### Accessibility Requirements

!!! info "ADA Compliance"
Organizations may be required to ensure their websites comply with the Americans with Disabilities Act (ADA) and Web Content Accessibility Guidelines (WCAG).

**Essential Accessibility Practices**:

- **Alt Text**: Provide descriptive alt text for all images
- **Heading Structure**: Use proper heading hierarchy (H1, H2, H3)
- **Color Contrast**: Ensure sufficient contrast between text and background colors
- **Keyboard Navigation**: Ensure all functions work with keyboard-only navigation
- **Screen Reader Compatibility**: Test content with screen reading software

**Content Guidelines**:

- Use clear, simple language when possible
- Provide captions or transcripts for video content
- Ensure links have descriptive text (avoid "click here")
- Structure content with proper headings and lists
- Test with accessibility checking tools

**Legal Considerations**: ADA compliance requirements may vary by organization type and size. Consult legal counsel for specific compliance requirements.

**Content Optimization**:

- **Keyword Strategy**: Use relevant keywords naturally in content
- **Content Quality**: Create valuable, informative content
- **Regular Updates**: Keep content fresh and current
- **User Experience**: Ensure content is easy to read and navigate

### Analytics and Performance

**Content Performance Metrics**:

- **Page Views**: Track which content is most popular
- **Time on Page**: Measure user engagement with content
- **Bounce Rate**: Monitor whether users stay to read content
- **Conversion Rates**: Track how content leads to desired actions

## Backup and Security

### Content Backup

**Regular Backup Procedures**:

- **Database Backups**: Regular automated database backups
- **Media File Backups**: Backup uploaded images and documents
- **Version Control**: Maintain history of content changes
- **Testing Restores**: Regularly test backup restoration procedures

**Content Recovery**:

- **Accidental Deletion**: Procedures for recovering deleted content
- **Version History**: Access to previous versions of content
- **Rollback Procedures**: Steps to revert problematic changes
- **Emergency Procedures**: Rapid response for critical issues

### Security Best Practices

**Access Security**:

- **Strong Passwords**: Require complex passwords for all users
- **Two-Factor Authentication**: Enable 2FA where possible
- **Regular Password Updates**: Periodically update passwords
- **Access Audits**: Regularly review user access and permissions

**Content Security**:

- **Input Validation**: Prevent malicious code injection
- **File Upload Security**: Scan uploaded files for security threats
- **Regular Updates**: Keep system software current with security patches
- **Activity Monitoring**: Track user activity for suspicious behavior

## Troubleshooting

### Common Content Issues

**Content Display Problems**:

- **Formatting Issues**: Check rich text editor output and HTML
- **Image Problems**: Verify image file format and size
- **Link Errors**: Test all internal and external links
- **Mobile Display**: Check content on various screen sizes

**Performance Issues**:

- **Slow Loading**: Optimize images and reduce content size
- **Database Issues**: Check for content causing database problems
- **Memory Usage**: Monitor system resources during content operations
- **Cache Problems**: Clear cache if content updates aren't visible

### Administrative Issues

**User Access Problems**:

- **Login Issues**: Verify username, password, and account status
- **Permission Problems**: Check user groups and individual permissions
- **Content Access**: Ensure users have appropriate content permissions
- **System Errors**: Check error logs for technical issues

**Data Integrity Issues**:

- **Content Corruption**: Check for damaged or incomplete content
- **Relationship Problems**: Verify links between related content items
- **Duplicate Content**: Identify and resolve duplicate entries
- **Missing Content**: Investigate and recover missing content

## Advanced Features

### Integration Capabilities

**External System Integration**:

- **Email Marketing**: Connect with email marketing platforms
- **Social Media**: Integrate with social media management tools
- **Analytics**: Connect with web analytics services
- **CRM Systems**: Integrate with customer relationship management tools

### Customization Options

**Template Customization**:

- **Custom Content Types**: Create specialized content types
- **Field Customization**: Add custom fields to existing content types
- **Workflow Customization**: Modify editorial and approval workflows
- **Interface Customization**: Customize admin interface for organization needs

### Automation Features

**Automated Content Management**:

- **Scheduled Publishing**: Automatically publish content at specified times
- **Content Archiving**: Automatically archive old content
- **Notification Systems**: Alert users to content requiring attention
- **Backup Automation**: Automated backup procedures and monitoring

## Best Practices Summary

### Content Strategy

**Effective Content Management**:

- **Plan Ahead**: Develop content calendars and strategic plans
- **Stay Consistent**: Maintain consistent voice, style, and quality
- **Monitor Performance**: Regularly review content effectiveness
- **User Focus**: Always consider the end user experience
- **Continuous Improvement**: Regularly refine processes and procedures

### Team Collaboration

**Collaborative Content Management**:

- **Clear Roles**: Define clear responsibilities for team members
- **Communication**: Maintain open communication about content needs
- **Training**: Provide adequate training for all content contributors
- **Documentation**: Document processes and procedures clearly
- **Regular Reviews**: Conduct periodic reviews of content and processes

This comprehensive guide covers all major aspects of content management in Coalition Builder. For specific technical questions or advanced customization needs, consult your system administrator or development team.
