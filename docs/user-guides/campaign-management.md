# Campaign Management Guide

This comprehensive guide covers how to create, manage, and optimize policy campaigns using Coalition Builder's campaign management system.

## Overview

Coalition Builder's campaign management system enables you to:

- **Create and manage policy campaigns** with detailed information
- **Associate bills and legislation** with campaigns
- **Track campaign status and progress** through various stages
- **Collect and manage endorsements** from stakeholders
- **Organize campaign-related content** and resources
- **Monitor campaign engagement** and effectiveness

## Understanding Campaigns

### What is a Campaign?

A campaign in Coalition Builder represents a coordinated effort to advocate for specific policy changes. Each campaign includes:

- **Campaign Information**: Title, description, goals, and status
- **Associated Bills**: Legislative bills related to the campaign
- **Stakeholder Endorsements**: Public support from organizations and individuals
- **Resources and Materials**: Documents, links, and media
- **Timeline and Status**: Campaign phases and progress tracking

### Campaign Lifecycle

**Typical Campaign Stages**:

1. **Planning**: Initial campaign setup and strategy development
2. **Active**: Public launch with endorsement collection
3. **Monitoring**: Tracking legislative progress and engagement
4. **Completed**: Campaign goals achieved or concluded
5. **Archived**: Historical campaigns for reference

## Creating a New Campaign

### Accessing Campaign Management

1. **Navigate to Django Admin**

   - Go to your admin interface (`/admin/`)
   - Look for the "Campaigns" section
   - Click "Campaigns" to view existing campaigns

2. **Add New Campaign**
   - Click "Add campaign" button
   - You'll see the campaign creation form

### Essential Campaign Information

**Basic Details**:

- **Title**: Clear, descriptive campaign name
- **Slug**: URL-friendly version (auto-generated from title)
- **Description**: Comprehensive campaign overview
- **Status**: Current campaign stage (draft, active, completed, etc.)

**Campaign Content**:

- **Overview**: Brief summary for public display
- **Goals**: Specific objectives and desired outcomes
- **Background**: Context and rationale for the campaign
- **Key Messages**: Primary talking points for supporters

**Visibility Settings**:

- **Is Published**: Controls public visibility
- **Featured**: Highlights campaign on homepage
- **Allow Endorsements**: Enables public endorsement collection

### Adding Campaign Details

**Rich Text Content**:

- Use the rich text editor for formatted content
- Include links to relevant resources
- Add bullet points for easy reading
- Keep content accessible and engaging

**SEO Optimization**:

- **Meta Description**: Brief description for search engines
- **Keywords**: Relevant terms for discoverability
- Use clear, descriptive titles and headings

## Managing Campaign Bills

### Adding Bills to Campaigns

1. **In Campaign Edit View**:

   - Scroll to "Campaign Bills" section
   - Click "Add another Campaign bill"

2. **Bill Information**:

   - **Bill Number**: Official legislative identifier (e.g., "HB 123")
   - **Title**: Official bill title
   - **Description**: Summary of bill contents
   - **Status**: Current legislative status
   - **URL**: Link to official bill text or legislative page

3. **Bill Relationship**:
   - **Position**: Support, Oppose, or Monitor
   - **Priority**: How central this bill is to the campaign
   - **Notes**: Internal notes about the bill's relevance

### Managing Multiple Bills

**When Campaigns Involve Multiple Bills**:

- Use consistent naming conventions
- Clearly indicate the relationship between bills
- Set appropriate priorities for each bill
- Keep bill status information current

**Bill Status Tracking**:

- **Introduced**: Bill has been filed
- **Committee**: Under committee review
- **Floor**: Scheduled for floor vote
- **Passed**: Approved by chamber
- **Signed**: Enacted into law
- **Failed**: Did not advance

## Campaign Status Management

### Status Options

**Draft**: Campaign in development

- Not visible to public
- Use for internal planning and preparation
- Can be edited extensively without public impact

**Active**: Campaign is live and accepting endorsements

- Visible on public website
- Endorsement collection enabled
- Regular updates and engagement activities

**Paused**: Temporarily inactive

- Public visibility maintained
- Endorsement collection disabled
- Used during legislative recess or strategic pauses

**Completed**: Campaign goals achieved

- Public visibility maintained for reference
- Endorsement collection disabled
- Success stories and outcomes documented

**Archived**: Historical campaigns

- Limited public visibility
- Used for old campaigns that are no longer relevant
- Maintains historical record

### Changing Campaign Status

**Status Change Considerations**:

- **Notify stakeholders** before major status changes
- **Update campaign content** to reflect current status
- **Preserve endorsements** when changing status
- **Document outcomes** when completing campaigns

## Endorsement Management

### Enabling Endorsements

1. **Campaign Settings**:

   - Check "Allow Endorsements" in campaign edit form
   - Ensure campaign status is "Active"
   - Verify campaign is published

2. **Endorsement Form Configuration**:
   - Customize endorsement form fields
   - Set moderation requirements
   - Configure confirmation messages

### Managing Campaign Endorsements

**Review Process**:

- Endorsements appear in admin queue after email verification
- Review each endorsement for appropriateness
- Approve legitimate endorsements for public display
- Reject spam or inappropriate submissions

**Endorsement Display**:

- Approved endorsements appear on campaign pages
- Endorsement counts are displayed prominently
- Featured endorsements can be highlighted
- Stakeholder types are clearly indicated

## Campaign Resources and Media

### Adding Resources

**Resource Types**:

- **Fact Sheets**: Key information documents
- **Position Papers**: Detailed policy analysis
- **Media Coverage**: News articles and coverage
- **Talking Points**: Brief messaging guides
- **Graphics and Images**: Visual campaign materials

### Media Management

**Image Guidelines**:

- Use high-quality images relevant to the campaign
- Optimize for web display (under 2MB)
- Include descriptive alt text for accessibility
- Maintain consistent visual branding

**Document Management**:

- Upload important documents directly to the campaign
- Use clear, descriptive filenames
- Keep documents current and relevant
- Provide context for each document

## Campaign Analytics and Monitoring

### Key Metrics to Track

**Engagement Metrics**:

- Page views and visitor traffic
- Time spent on campaign pages
- Endorsement submission rates
- Social media shares and engagement

**Stakeholder Metrics**:

- Number of endorsements received
- Types of endorsing organizations
- Geographic distribution of supporters
- Growth rate of endorsements over time

**Legislative Metrics**:

- Bill advancement status
- Committee hearing schedules
- Vote counts and outcomes
- Media coverage and mentions

### Reporting and Analysis

**Regular Review Schedule**:

- Weekly engagement reviews during active campaigns
- Monthly stakeholder analysis
- Quarterly campaign effectiveness assessment
- Post-campaign comprehensive analysis

## Campaign Communication

### Stakeholder Updates

**Regular Communications**:

- **Campaign Launch**: Announce new campaigns to stakeholder networks
- **Progress Updates**: Share legislative developments and milestones
- **Action Alerts**: Mobilize supporters for specific actions
- **Success Stories**: Celebrate achievements and progress

### Content Strategy

**Effective Campaign Content**:

- **Clear messaging** that resonates with target audiences
- **Regular updates** to maintain engagement
- **Compelling narratives** that explain why the campaign matters
- **Actionable information** that empowers supporters

## Legal and Compliance Considerations

!!! warning "Important Legal Notice"
This software is designed for policy advocacy and coalition building. Organizations using Coalition Builder must ensure compliance with applicable laws, including but not limited to:

### Campaign Finance and Political Activity Laws

**Before Using Coalition Builder**:

- **Consult legal counsel** familiar with campaign finance and lobbying laws in your jurisdiction
- **Understand your organization's tax status** and any restrictions on political activities (especially 501(c)(3) nonprofits)
- **Review coordination rules** between organizations and political committees
- **Ensure compliance** with contribution tracking and disclosure requirements

**Key Legal Areas to Consider**:

- **Lobbying Registration**: Activities may trigger lobbying registration requirements
- **Campaign Finance Reporting**: Coordination with campaigns may require disclosure
- **Political Activity Limits**: Tax-exempt organizations face restrictions on political activities
- **Foreign National Restrictions**: Prohibitions on foreign national participation in U.S. political activities

**State and Local Laws**:

- Requirements vary significantly by jurisdiction
- Some states have additional disclosure and registration requirements
- Local ordinances may impose additional restrictions

### Privacy and Data Protection

**Data Protection Compliance**:

- **GDPR**: Required for any stakeholders in the European Union
- **CCPA**: Required for California residents
- **State Privacy Laws**: Growing number of state-level requirements
- **Sector-Specific Laws**: Additional requirements may apply to certain organizations

**Data Handling Requirements**:

- Obtain proper consent for data collection and use
- Provide clear privacy notices to stakeholders
- Implement data retention and deletion policies
- Ensure secure data handling and breach notification procedures

### Disclaimer

Coalition Builder is a tool for organizing advocacy efforts. **It is not legal advice and does not ensure compliance with any laws or regulations.** Organizations are solely responsible for ensuring their use of the platform complies with all applicable laws. Always consult qualified legal counsel before launching advocacy campaigns.

## Best Practices

### Campaign Planning

**Before Launch**:

- Clearly define campaign goals and success metrics
- Identify target stakeholder groups
- Develop key messages and talking points
- Plan timeline and major milestones
- Prepare supporting materials and resources

**During Campaign**:

- Monitor engagement and adjust strategy as needed
- Keep content fresh and updated
- Respond promptly to endorsements and inquiries
- Track legislative developments closely
- Maintain regular communication with supporters

**After Campaign**:

- Document outcomes and lessons learned
- Thank supporters and endorsers
- Archive campaign materials appropriately
- Analyze effectiveness for future campaigns

### Content Guidelines

**Writing Effective Campaign Content**:

- **Be specific** about policy goals and desired outcomes
- **Use plain language** that non-experts can understand
- **Include concrete examples** of how policies affect people
- **Provide clear next steps** for supporters
- **Keep information current** and factually accurate

### Stakeholder Engagement

**Building Strong Coalitions**:

- **Identify diverse stakeholders** across different sectors
- **Provide multiple ways** for people to get involved
- **Recognize and thank** supporters publicly
- **Share success stories** that demonstrate impact
- **Maintain relationships** beyond individual campaigns

## Troubleshooting

### Common Issues

**Low Endorsement Rates**:

- Review endorsement form for complexity
- Check if campaign messaging is compelling
- Verify endorsement process is working correctly
- Consider outreach strategy effectiveness

**Content Management Problems**:

- Ensure proper permissions for content editors
- Check for formatting issues in rich text editor
- Verify image and document uploads are working
- Test campaign pages on different devices

**Status and Visibility Issues**:

- Confirm campaign is published and status is correct
- Check homepage display settings
- Verify navigation and linking
- Test from public user perspective

### Technical Support

**For Technical Issues**:

- Check Django admin error messages
- Verify database connections and permissions
- Test campaign functionality systematically
- Contact system administrator for server issues

## Advanced Features

### Campaign Categories and Tags

**Organization Tools**:

- Use categories to group related campaigns
- Add tags for cross-campaign themes
- Create filtered views for different audiences
- Enable advanced search capabilities

### Integration Options

**External Tool Integration**:

- Connect with email marketing platforms
- Integrate with social media management tools
- Link to external advocacy platforms
- Connect with legislative tracking services

### Automation Features

**Automated Processes**:

- Scheduled campaign status updates
- Automatic stakeholder notifications
- Regular reporting and analytics
- Integration with legislative tracking

This guide provides comprehensive coverage of campaign management in Coalition Builder. For advanced customization or technical questions, consult your system administrator or development team.
