# Troubleshooting Guide

This guide covers common issues you might encounter when working with Coalition Builder and their solutions.

## Common Issues

### Homepage Issues

#### Homepage not displaying changes

**Problem**: Changes made in the Django admin are not appearing on the homepage.

**Solutions**:

1. **Check Active Status**: Ensure the homepage configuration has "Is Active" checked
2. **Clear Browser Cache**: Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. **Check Content Block Visibility**: Verify content blocks have "Is Visible" enabled
4. **Database Connection**: Ensure the backend is properly connected to the database

#### Images not loading

**Problem**: Images specified in content blocks or hero sections are not displaying.

**Solutions**:

1. **Use Full URLs**: Ensure image URLs start with `https://` or `http://`
2. **Check URL Accessibility**: Test the image URL in a new browser tab
3. **Verify Image Format**: Use common formats (JPG, PNG, GIF, WebP)
4. **Check File Permissions**: Ensure images are publicly accessible

#### CTA buttons not working

**Problem**: Call-to-action buttons don't navigate to intended destinations.

**Solutions**:

1. **Use Full URLs**: Button URLs must include protocol (`https://example.com/page`)
2. **Test Links**: Verify URLs work in a new browser tab
3. **Check for Typos**: Ensure URLs are spelled correctly
4. **Relative vs Absolute**: Use absolute URLs for external links

### API Issues

#### API endpoints returning 404 errors

**Problem**: API calls to `/api/homepage/` or other endpoints fail with 404.

**Solutions**:

1. **Check Django URL Configuration**: Verify API URLs are properly configured
2. **Database Migration**: Run `python manage.py migrate` to ensure tables exist
3. **Check Django Settings**: Verify `ALLOWED_HOSTS` includes your domain
4. **Server Status**: Ensure the Django development server is running

#### API returning 500 errors

**Problem**: API endpoints return internal server errors.

**Solutions**:

1. **Check Django Logs**: Look for error details in the console output
2. **Database Connection**: Verify database connection settings
3. **Missing Dependencies**: Ensure all required packages are installed
4. **Check Model Validation**: Verify model fields meet validation requirements

### Database Issues

#### Migration errors

**Problem**: `python manage.py migrate` fails with database errors.

**Solutions**:

1. **Check Database Connection**: Verify `DATABASE_URL` or database settings
2. **Create Database**: Ensure the database exists before running migrations
3. **Check Permissions**: Verify the database user has necessary permissions
4. **Reset Migrations**: In development, you may need to reset migration files

#### Data validation errors

**Problem**: Creating content through admin interface fails with validation errors.

**Solutions**:

1. **URL Fields**: Ensure URL fields contain valid, full URLs
2. **Required Fields**: Check that all required fields are filled
3. **Email Format**: Verify email addresses are properly formatted
4. **Unique Constraints**: Ensure only one homepage is marked as active

### Development Environment Issues

#### Docker containers not starting

**Problem**: `docker-compose up` fails or containers exit immediately.

**Solutions**:

1. **Check Docker Logs**: Use `docker-compose logs` to see error details
2. **Port Conflicts**: Ensure required ports (8000, 3000, 5432) are available
3. **Environment Variables**: Verify all required environment variables are set
4. **Docker Resources**: Ensure Docker has sufficient memory and disk space

#### Frontend not connecting to backend

**Problem**: React frontend cannot fetch data from Django API.

**Solutions**:

1. **Check API URL**: Verify `REACT_APP_API_URL` points to correct backend
2. **CORS Settings**: Ensure Django CORS settings allow frontend domain
3. **Network Connectivity**: Test API endpoints directly with curl or browser
4. **Port Configuration**: Verify backend is running on expected port

### Performance Issues

#### Slow page loading

**Problem**: Homepage loads slowly or times out.

**Solutions**:

1. **Optimize Images**: Use appropriately sized images
2. **Database Queries**: Check for inefficient database queries
3. **Caching**: Implement appropriate caching strategies
4. **CDN Usage**: Consider using a CDN for static assets

#### High memory usage

**Problem**: Application consumes excessive memory.

**Solutions**:

1. **Database Connection Pooling**: Configure appropriate connection limits
2. **Query Optimization**: Optimize database queries to reduce memory usage
3. **Static File Handling**: Serve static files through web server, not Django
4. **Monitor Resources**: Use tools to identify memory leaks

## Getting Additional Help

### Documentation Resources

- [User Guides](../user-guides/content-management.md) - Basic usage instructions
- [Development Setup](../development/setup.md) - Environment configuration
- [API Reference](../api/index.md) - Detailed API documentation

### Debug Information

When reporting issues, include:

1. **Error Messages**: Copy exact error text
2. **Steps to Reproduce**: Detailed steps that cause the issue
3. **Environment Details**: Operating system, Python version, Docker version
4. **Browser Information**: Browser name and version (for frontend issues)
5. **Console Output**: Relevant logs from Django or browser console

### Common Log Locations

- **Django Development**: Console output where `manage.py runserver` is running
- **Docker Logs**: `docker-compose logs [service-name]`
- **Browser Console**: Developer tools (F12) → Console tab
- **Database Logs**: Check PostgreSQL logs if using database directly

### Contact and Support

For issues not covered in this guide:

1. Check the project's issue tracker on GitHub
2. Review existing documentation for similar problems
3. Create a detailed bug report with reproduction steps

## Prevention Tips

### Best Practices

1. **Regular Backups**: Back up your database regularly
2. **Version Control**: Keep configuration files in version control
3. **Environment Consistency**: Use identical environments for development and production
4. **Monitoring**: Set up monitoring for critical services
5. **Documentation**: Keep local documentation updated with any customizations

### Development Workflow

1. **Test Locally**: Test all changes in development environment first
2. **Use Version Control**: Commit changes frequently with descriptive messages
3. **Database Migrations**: Create and test migrations before applying to production
4. **Environment Variables**: Keep sensitive configuration in environment variables
5. **Code Reviews**: Have changes reviewed before deploying to production
