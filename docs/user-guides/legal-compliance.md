# Legal Compliance Guide

This guide covers how to configure and manage legal compliance features in Coalition Builder, including Terms of Use, Privacy Policy, and GDPR-compliant cookie consent.

## Overview

Coalition Builder includes comprehensive legal compliance features to help protect your organization from liability and meet regulatory requirements like GDPR and CCPA.

### Key Features

- **Terms of Use Management**: Version-controlled legal documents with acceptance tracking
- **Privacy Policy**: Configurable privacy documentation for user transparency
- **Cookie Consent**: GDPR-compliant cookie consent management with vanilla-cookieconsent
- **Acceptance Audit Trail**: Track when and how users accept legal terms

## Terms of Use Configuration

### Creating Legal Documents

1. **Access Django Admin**: Navigate to `/admin/` and log in with admin credentials
2. **Go to Legal Documents**: Click on "Legal Documents" under the "Legal" section
3. **Add New Document**: Click "Add Legal Document"

### Document Fields

- **Document Type**: Choose from "Terms of Use", "Privacy Policy", "Cookie Policy", or "Acceptable Use Policy"
- **Title**: Display title for the document
- **Content**: Full legal text (HTML formatting supported)
- **Version**: Version identifier (e.g., "1.0", "2024-01-01")
- **Is Active**: Only one document per type can be active at a time
- **Effective Date**: When this version becomes effective

### Example Fixture Data

Use the provided example fixtures to get started:

```bash
# Load example Terms of Use
python manage.py loaddata sample_data/example_legal_terms_of_use.json

# Load example Privacy Policy
python manage.py loaddata sample_data/example_legal_privacy_policy.json
```

### Customizing Legal Content

1. Copy the example fixtures from `sample_data/` directory
2. Modify the content to match your organization's needs
3. Update contact information, addresses, and legal requirements
4. Load your customized fixtures into the database

## Terms Acceptance Tracking

### How It Works

When users submit endorsements with terms acceptance:

- **Audit Trail**: Records IP address, user agent, and timestamp
- **Document Version**: Links to specific version of terms accepted
- **Unique Token**: Each acceptance gets a unique identifier
- **Immutable Records**: Acceptance records cannot be modified after creation

### Viewing Acceptance Records

1. Go to Django Admin → "Terms Acceptances"
2. View detailed acceptance history with stakeholder information
3. Filter by date, document type, or endorsement
4. Export records for legal compliance audits

## Cookie Consent Management

### GDPR Compliance

Coalition Builder uses vanilla-cookieconsent for client-side cookie management:

- **Necessary Cookies**: Always enabled (session, security, preferences)
- **Analytics Cookies**: Optional, user-controlled
- **Consent Banner**: Appears on first visit
- **Preference Center**: Users can modify choices anytime

### Cookie Categories

#### Strictly Necessary

- Session management
- CSRF protection
- User preferences
- Authentication tokens

#### Analytics (Optional)

- Website usage statistics
- Performance monitoring
- User behavior analysis

### Configuration

Cookie consent is automatically configured with sensible defaults. The banner includes:

- Clear description of cookie usage
- Accept/Reject options
- Link to Privacy Policy
- Preferences management

## Privacy Policy Management

### Required Sections

Ensure your privacy policy covers:

- **Data Collection**: What personal data you collect
- **Usage Purpose**: Why you collect and process data
- **Data Sharing**: If and how data is shared with third parties
- **User Rights**: How users can access, modify, or delete their data
- **Contact Information**: How to reach your privacy officer

### Integration Points

Privacy policy is automatically linked from:

- Footer on all SSR pages
- Cookie consent banner
- Terms of Use references
- Endorsement form disclosures

## Legal Page Management

### Automatic Page Generation

Legal documents are automatically available at:

- `/terms` - Active Terms of Use
- `/privacy` - Active Privacy Policy

### Error Handling

If no active document exists:

- Returns 404 with helpful error message
- Suggests contacting administration
- Maintains site functionality

### Content Security

All legal document content is:

- **Sanitized**: HTML content is cleaned to prevent XSS
- **Versioned**: Historical versions are preserved
- **Auditable**: Creation and modification tracking

## API Integration

### Available Endpoints

- `GET /api/legal/terms/` - Current Terms of Use
- `GET /api/legal/privacy/` - Current Privacy Policy
- `GET /api/legal/documents/` - List all active documents

### Response Format

```json
{
  "id": 1,
  "title": "Terms of Use",
  "content": "<h1>Terms of Use</h1>...",
  "version": "1.0",
  "effective_date": "2025-01-01T00:00:00Z",
  "document_type": "terms"
}
```

## Best Practices

### Document Management

1. **Version Control**: Always increment version numbers when making changes
2. **Effective Dates**: Set future effective dates for major changes
3. **Content Review**: Have legal counsel review all documents
4. **Regular Updates**: Review and update annually or as regulations change

### Compliance Monitoring

1. **Acceptance Tracking**: Regularly audit terms acceptance records
2. **Cookie Compliance**: Monitor cookie usage and user preferences
3. **Privacy Requests**: Implement processes for data subject requests
4. **Documentation**: Maintain records of all legal document changes

### User Experience

1. **Clear Language**: Use plain language where possible
2. **Accessibility**: Ensure documents are screen reader friendly
3. **Mobile Friendly**: Test legal pages on mobile devices
4. **Easy Navigation**: Provide clear links and breadcrumbs

## Troubleshooting

### Common Issues

**No Legal Documents Displayed**

- Check that documents are marked as "active"
- Verify effective dates are not in the future
- Ensure database migrations have run

**Cookie Consent Not Appearing**

- Check browser developer tools for JavaScript errors
- Verify vanilla-cookieconsent is loaded
- Clear browser cache and cookies

**Terms Acceptance Not Recording**

- Check endorsement form includes terms checkbox
- Verify API endpoints are accessible
- Review Django logs for errors

### Legal Compliance Checklist

- [ ] Terms of Use created and active
- [ ] Privacy Policy created and active
- [ ] Cookie consent banner functional
- [ ] Terms acceptance tracking working
- [ ] Legal pages accessible via navigation
- [ ] Contact information updated in all documents
- [ ] Jurisdiction and governing law specified
- [ ] Data retention policies documented
- [ ] User rights clearly explained
- [ ] Compliance audit procedures in place

## Support

For legal compliance questions:

1. **Technical Issues**: Check Django admin logs and API responses
2. **Legal Content**: Consult with qualified legal counsel
3. **Regulatory Compliance**: Review current GDPR, CCPA, and local requirements
4. **Implementation**: Refer to the development team documentation

Remember: This documentation provides technical guidance only. Always consult qualified legal counsel for compliance with applicable laws and regulations.
