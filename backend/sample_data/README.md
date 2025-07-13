# Sample Data and Example Fixtures

This directory contains example fixtures and sample data that you can use when setting up your own coalition-builder instance.

## Legal Documents

### `example_legal_terms_of_use.json`

Example Terms of Use document that provides comprehensive legal protection for your coalition-builder site. This includes:

- User responsibilities and acceptable use
- Content and endorsement policies
- Privacy and data collection terms
- Liability limitations and indemnification
- Termination and dispute resolution clauses

**To use this fixture:**

1. Copy the file to your `fixtures/` directory (which is gitignored)
2. Customize the content to match your organization's specific needs
3. Update the effective date and version number
4. Load it with: `python manage.py loaddata fixtures/your_legal_terms.json`

**Important:** This is provided as an example only. You should have your legal terms reviewed by a qualified attorney before using them in production.

## Other Sample Data

### `fixtures.json`

Contains sample data for testing and development purposes.

## Creating Your Own Fixtures

When creating fixtures for your organization:

1. Place them in the `fixtures/` directory (gitignored for security)
2. Use descriptive filenames that indicate the content type
3. Number them if order matters (e.g., `01_legal_terms.json`, `02_privacy_policy.json`)
4. Always review legal content with qualified counsel before production use

## Security Note

Never commit actual legal documents or production data to version control. This directory contains only sanitized examples for reference.
