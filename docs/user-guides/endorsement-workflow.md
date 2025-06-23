# Endorsement Workflow Guide

This guide explains how the comprehensive endorsement system works in Coalition Builder, from initial submission through email verification, admin review, and public display.

## Overview

The endorsement system allows stakeholders (farmers, watermen, businesses, nonprofits, individuals, etc.) to publicly endorse policy campaigns through a secure, multi-step verification process. This creates a credible coalition of support with email verification, spam prevention, and admin moderation capabilities.

## User Journey

### 1. Campaign Discovery

Stakeholders discover campaigns through:

- **Campaign List Page**: Shows all active campaigns with endorsement counts
- **Direct Links**: Campaigns can be shared via direct URLs
- **Homepage**: Featured campaigns may be highlighted on the homepage

### 2. Campaign Details

When viewing a campaign, stakeholders see:

- **Campaign Information**: Title, summary, detailed description
- **Endorsement Statement**: The standard statement they'll be endorsing
- **Current Endorsements**: List of public endorsements from other stakeholders
- **Endorsement Form**: Form to submit their own endorsement

### 3. Endorsement Submission

The endorsement form collects:

**Required Information:**

- Name
- Organization
- Email address
- State
- Stakeholder type (farmer, waterman, business, nonprofit, individual, government, other)

**Optional Information:**

- Role within organization
- County
- Custom endorsement statement (defaults to campaign's endorsement statement)
- Public display preference (defaults to public)

### 4. Form Validation

The system validates:

- All required fields are completed
- Email address format is valid
- Email address hasn't already endorsed this campaign
- Stakeholder type is valid

### 5. Spam Prevention

Before processing, the system runs comprehensive spam checks:

**Automated Checks:**

- **Rate Limiting**: IP-based submission limits (3 attempts per 5 minutes)
- **Honeypot Fields**: Hidden form fields to detect bots
- **Timing Analysis**: Form completion time validation
- **Email Reputation**: Checks for disposable email domains and suspicious patterns
- **Content Quality**: Analysis for spam keywords and suspicious content patterns

**Response to Spam Detection:**

- High-confidence spam submissions are automatically rejected
- Suspicious submissions are flagged for manual review
- Rate limit violations temporarily block further submissions

### 6. Endorsement Processing

When a legitimate submission passes spam checks:

1. **Stakeholder Creation/Update**: If the email exists, updates the stakeholder; otherwise creates new
2. **Endorsement Creation**: Creates the endorsement record with "pending" status
3. **Email Normalization**: Emails are normalized to lowercase for consistency
4. **Verification Email**: Automatic verification email sent to stakeholder
5. **Admin Notification**: Admins notified of new endorsement requiring review

### 7. Email Verification Process

**Initial Status**: All new endorsements start as "pending" and require email verification

**Verification Steps:**

1. **Verification Email**: Stakeholder receives email with unique verification link
2. **Link Expiration**: Verification links expire after 24 hours for security
3. **One-Click Verification**: Stakeholders click link to verify their email address
4. **Status Update**: Verified endorsements move to "approved" status (if auto-approval enabled)
5. **Confirmation Email**: Stakeholders receive confirmation when endorsement is approved

**Verification Features:**

- Unique UUID tokens for each endorsement
- Secure verification links with token validation
- Automatic expiration and regeneration capabilities
- Resend verification email functionality

### 8. Admin Review Process

**Admin Dashboard**: Enhanced Django admin interface for endorsement management

**Review Capabilities:**

- **Status Management**: Approve, reject, or mark endorsements as verified
- **Bulk Actions**: Process multiple endorsements simultaneously
- **Visual Indicators**: Color-coded status badges and verification indicators
- **Email Management**: Send verification emails or approval notifications
- **Review Tracking**: Track which admin reviewed each endorsement and when

**Review Workflow:**

1. **New Submission Review**: Admins see pending endorsements in dashboard
2. **Quality Assessment**: Review stakeholder information and endorsement content
3. **Status Decision**: Approve for public display or reject with notes
4. **Notification**: Automatic confirmation emails sent to approved stakeholders

### 9. Public Display

**Display Requirements**: Only endorsements that meet ALL criteria are shown publicly:

- ✅ Email verified by stakeholder
- ✅ Approved by admin review
- ✅ Public display enabled
- ✅ Campaign allows endorsements

**Public Information Displayed:**

- **Endorsement Count**: Updated count on campaign listings
- **Endorsement List**: All approved, verified, public endorsements
- **Stakeholder Information**: Name, organization, role, location, type
- **Endorsement Statement**: Custom statement or campaign default
- **Verification Status**: Visual indicators showing verified endorsements
- **Date**: When the endorsement was submitted and approved

## Technical Implementation

### Backend (Django)

```python
# Models
- PolicyCampaign: Campaigns that can be endorsed
- Stakeholder: People/organizations who endorse (with email verification)
- Endorsement: Links stakeholders to campaigns (with verification workflow)

# Endorsement Model Fields
- verification_token: UUID for email verification
- email_verified: Boolean verification status
- verification_sent_at: Timestamp of verification email
- verified_at: Timestamp when email was verified
- status: pending/verified/approved/rejected
- admin_notes: Internal notes for admin review
- reviewed_by: Admin user who reviewed endorsement
- reviewed_at: Timestamp of admin review

# Services
- EndorsementEmailService: Email verification and notifications
- SpamPreventionService: Comprehensive spam detection
- Django Admin: Custom admin interface for endorsement management

# Security Features
- Email verification with secure tokens
- Rate limiting and spam prevention
- Admin moderation workflow
- Audit trail for all endorsement actions
```

### Frontend (React)

```typescript
// Key components
- CampaignsList: Shows campaigns with endorsement counts
- CampaignDetail: Campaign info + endorsement form + endorsement list
- EndorsementForm: Form for submitting endorsements
- EndorsementsList: Displays all endorsements for a campaign

// API integration
- createEndorsement(): Submit new endorsements
- getEndorsements(): Fetch all endorsements
- getCampaignEndorsements(): Fetch endorsements for specific campaign
```

### API Endpoints

**Public Endpoints:**

- `GET /api/campaigns/` - List campaigns with basic info
- `GET /api/campaigns/{id}/` - Campaign details with endorsement fields
- `GET /api/campaigns/?name={name}` - Campaign details by machine name
- `POST /api/endorsements/` - Submit new endorsement (with spam prevention)
- `GET /api/endorsements/` - All approved, verified, public endorsements
- `GET /api/endorsements/?campaign_id={id}` - Campaign-specific endorsements

**Verification Endpoints:**

- `POST /api/endorsements/verify/{token}/` - Verify endorsement email
- `POST /api/endorsements/resend-verification/` - Resend verification email

**Admin Endpoints** (authentication required):

- `POST /api/endorsements/admin/approve/{id}/` - Approve endorsement
- `POST /api/endorsements/admin/reject/{id}/` - Reject endorsement
- `GET /api/endorsements/admin/pending/` - List pending endorsements

**Export Endpoints** (admin only):

- `GET /api/endorsements/export/csv/` - Export endorsements as CSV
- `GET /api/endorsements/export/json/` - Export endorsements as JSON

## Admin Workflow

### Campaign Setup for Endorsements

1. **Create Campaign**: Set up basic campaign information
2. **Configure Endorsement Settings**:

   - `allow_endorsements`: Enable/disable endorsement collection
   - `endorsement_statement`: Default statement stakeholders will endorse
   - `endorsement_form_instructions`: Guidance for stakeholders filling out the form

3. **Monitor Endorsements**: View and manage endorsements through the Django admin

### Endorsement Management

**Admin Dashboard Features:**

- **Comprehensive Overview**: View all endorsements with status, verification, and review information
- **Advanced Filtering**: Filter by status, verification, campaign, stakeholder type, and date ranges
- **Bulk Operations**: Approve, reject, or verify multiple endorsements simultaneously
- **Email Management**: Send verification emails, approval notifications, and custom communications
- **Export Capabilities**: Export endorsement data in CSV or JSON format with filtering
- **Audit Trail**: Track all administrative actions with user attribution and timestamps

**Review Workflow:**

- **Status Management**: Move endorsements through pending → verified → approved workflow
- **Quality Control**: Review stakeholder information and endorsement content
- **Notification System**: Automatic emails for verification, approval, and rejection
- **Admin Notes**: Internal notes for tracking review decisions and follow-up actions

**Security and Moderation:**

- **Spam Detection**: Built-in spam prevention with confidence scoring
- **Verification Management**: Track email verification status and resend capabilities
- **Access Control**: Role-based permissions for endorsement management
- **Data Integrity**: Comprehensive validation and error handling

## Best Practices

### For Campaign Creators

1. **Clear Endorsement Statement**: Write a concise, compelling statement that stakeholders will be comfortable endorsing
2. **Helpful Instructions**: Provide clear guidance on why endorsements matter and how they'll be used
3. **Enable Endorsements Early**: Turn on endorsement collection as soon as the campaign is ready
4. **Monitor Engagement**: Track endorsement growth and follow up with stakeholders

### For Stakeholders

1. **Provide Complete Information**: Fill out all fields to make endorsements more credible
2. **Custom Statements**: Consider adding personal reasons for support in the statement field
3. **Professional Information**: Use official titles and organization names
4. **Public Display**: Consider making endorsements public to maximize advocacy impact

## Privacy and Data Handling

### Data Security

- **Email Privacy**: Email addresses are never displayed publicly and are used only for verification
- **Secure Verification**: Email verification uses cryptographically secure UUID tokens
- **Contact Information**: Only name, organization, role, and location are shown publicly
- **Update Rights**: Stakeholders with existing records can update their information
- **Duplicate Prevention**: Email-based deduplication prevents multiple endorsements per campaign

### Multi-Layer Display Control

- **Triple Verification**: Endorsements must be email-verified, admin-approved, AND public to display
- **Stakeholder Choice**: Stakeholders can choose private endorsements during submission
- **Admin Moderation**: Administrators review and approve all endorsements before public display
- **Campaign Control**: Campaign-level endorsement display can be disabled
- **Audit Trail**: All display status changes are tracked with timestamps and user attribution

### Spam Prevention and Security

- **Rate Limiting**: IP-based submission limits to prevent abuse
- **Content Analysis**: Automatic detection of spam keywords and suspicious patterns
- **Email Validation**: Comprehensive checks for disposable emails and suspicious patterns
- **Honeypot Protection**: Hidden form fields to detect automated submissions
- **Timing Analysis**: Form submission timing validation to detect bots

## Troubleshooting

### Common Issues

**"Email already exists" Error**

- One stakeholder can only endorse each campaign once
- If updating information, the system will update the existing stakeholder record and reset verification status

**"Spam detected" Error**

- Submission triggered spam prevention measures
- Check for rapid successive submissions (rate limiting)
- Verify all form fields are filled appropriately
- Ensure email address is from a legitimate domain

**"Verification link expired" Error**

- Email verification links expire after 24 hours
- Request a new verification email through the resend endpoint
- Check email spam folder for verification messages

**Endorsements Not Appearing Publicly**

- **Not Email Verified**: Stakeholder must click verification link in email
- **Not Admin Approved**: Endorsement requires admin review and approval
- **Public Display Disabled**: Check that `public_display` is set to true
- **Campaign Settings**: Verify the campaign has `allow_endorsements` enabled
- **Status Check**: Endorsement must have "approved" status to appear publicly

**Verification Email Issues**

- Check email spam/junk folders
- Verify email address was entered correctly
- Use resend verification endpoint if email not received
- Contact administrators if persistent email delivery issues

**Admin Review Delays**

- New endorsements require manual admin review
- Approval notifications are sent automatically when processed
- Complex or suspicious submissions may require additional review time

### Support

For technical issues or questions about the endorsement system:

- Check the [API documentation](../api/index.md) for endpoints
- Review the [development setup guide](../development/setup.md) for local testing
- Review [spam prevention configuration](../reference/environment.md) for customization
- Check the [admin troubleshooting guide](../admin/troubleshooting.md) for management issues
- Submit issues to the project repository with detailed reproduction steps

### Features Summary

**Current Features:**

- ✅ **Email Verification System**: Secure token-based email verification with automated workflows
- ✅ **Admin Review Interface**: Enhanced Django admin with bulk actions and status management
- ✅ **Spam Prevention**: Comprehensive protection including rate limiting, honeypots, and content analysis
- ✅ **Export Functionality**: CSV and JSON export capabilities with filtering options
- ✅ **Enhanced Security**: Multi-layer verification, audit trails, and secure token management
- ✅ **Automated Notifications**: Email notifications for verification, approval, and admin alerts
- ✅ **Quality Assurance**: 71 comprehensive tests covering all new functionality
