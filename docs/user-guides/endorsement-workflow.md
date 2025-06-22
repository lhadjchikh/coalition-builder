# Endorsement Workflow Guide

This guide explains how the endorsement system works in Coalition Builder, from a stakeholder submitting an endorsement to it being displayed publicly.

## Overview

The endorsement system allows stakeholders (farmers, watermen, businesses, nonprofits, individuals, etc.) to publicly endorse policy campaigns. This creates a visible coalition of support that can be used for advocacy and lobbying efforts.

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

### 5. Endorsement Processing

When submitted:

1. **Stakeholder Creation/Update**: If the email exists, updates the stakeholder; otherwise creates new
2. **Endorsement Creation**: Creates the endorsement record linking stakeholder to campaign
3. **Email Normalization**: Emails are normalized to lowercase for consistency
4. **Success Response**: Returns the created endorsement with stakeholder details

### 6. Public Display

Endorsed campaigns show:

- **Endorsement Count**: Updated count on campaign listings
- **Endorsement List**: All public endorsements with stakeholder details
- **Stakeholder Information**: Name, organization, role, location, type
- **Endorsement Statement**: Custom statement or campaign default
- **Date**: When the endorsement was submitted

## Technical Implementation

### Backend (Django)

```python
# Models involved
- PolicyCampaign: Campaigns that can be endorsed
- Stakeholder: People/organizations who endorse
- Endorsement: Links stakeholders to campaigns

# Key features
- Unique email constraint per campaign (one endorsement per email per campaign)
- Automatic stakeholder creation/update on endorsement
- Email normalization to prevent duplicates
- Public/private endorsement display control
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

- `GET /api/campaigns/` - List campaigns with basic info
- `GET /api/campaigns/{id}/` - Campaign details with endorsement fields
- `POST /api/endorsements/` - Submit new endorsement
- `GET /api/endorsements/` - All public endorsements
- `GET /api/campaigns/{id}/endorsements/` - Campaign-specific endorsements

## Admin Workflow

### Campaign Setup for Endorsements

1. **Create Campaign**: Set up basic campaign information
2. **Configure Endorsement Settings**:

   - `allow_endorsements`: Enable/disable endorsement collection
   - `endorsement_statement`: Default statement stakeholders will endorse
   - `endorsement_form_instructions`: Guidance for stakeholders filling out the form

3. **Monitor Endorsements**: View and manage endorsements through the Django admin

### Endorsement Management

Administrators can:

- View all endorsements for each campaign
- Toggle endorsement visibility (public/private)
- Export endorsement data
- Contact stakeholders who have endorsed

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

### Stakeholder Data

- **Email Privacy**: Email addresses are never displayed publicly
- **Contact Information**: Only name, organization, role, and location are shown publicly
- **Update Rights**: Stakeholders with existing records can update their information
- **Duplicate Prevention**: Email-based deduplication prevents multiple endorsements per campaign

### Public Display Control

- **Default Public**: Endorsements default to public display
- **Opt-out Available**: Stakeholders can choose private endorsements
- **Admin Override**: Administrators can toggle endorsement visibility
- **Bulk Display Control**: Campaign-level endorsement display can be disabled

## Troubleshooting

### Common Issues

**"Email already exists" Error**

- One stakeholder can only endorse each campaign once
- If updating information, the system will update the existing stakeholder record

**Form Validation Errors**

- Check that all required fields are completed
- Verify email address format
- Ensure stakeholder type is selected from valid options

**Endorsements Not Appearing**

- Check that `public_display` is set to true
- Verify the campaign has `allow_endorsements` enabled
- Confirm the endorsement was successfully created

### Support

For technical issues or questions about the endorsement system:

- Check the [API documentation](../api/index.md)
- Review the [development setup guide](../development/setup.md)
- Submit issues to the project repository
