# Vercel Deployment Configuration

## Initial Setup

### 1. Create Vercel Account and Project

1. Sign up at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select the `frontend` directory as the root
4. Framework preset: Next.js
5. Skip the initial deployment (we'll use GitHub Actions)

### 2. Get Vercel Credentials

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project (run in frontend directory)
cd frontend
vercel link

# Get your credentials
vercel project ls  # Note the project ID
vercel team ls     # Note the org/team ID
```

### 3. Set GitHub Secrets

Add these as **repository secrets** in GitHub:

- `VERCEL_TOKEN`: Your Vercel API token from [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID`: Your Vercel team/org ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### 4. Set GitHub Variables

Add these as **repository variables** (or environment-specific):

#### Development

- `DEVELOPMENT_API_URL`: `https://api-dev.yourdomain.com` or Lambda API Gateway URL
- `DEVELOPMENT_SITE_URL`: `https://dev.yourdomain.com`

#### Staging

- `STAGING_API_URL`: `https://api-staging.yourdomain.com` or Lambda API Gateway URL
- `STAGING_SITE_URL`: `https://staging.yourdomain.com`

#### Production

- `PRODUCTION_API_URL`: `https://api.yourdomain.com` or Lambda API Gateway URL
- `PRODUCTION_SITE_URL`: `https://yourdomain.com`
- `PRODUCTION_DOMAIN`: `yourdomain.com` (for aliasing)

#### Optional

- `GOOGLE_ANALYTICS_ID`: Your GA tracking ID

## Environment Variables in Vercel

The deployment workflow automatically sets these environment variables:

- `NEXT_PUBLIC_API_URL`: Backend API URL (Lambda/API Gateway)
- `NEXT_PUBLIC_ENVIRONMENT`: Current environment (dev/staging/production)
- `NEXT_PUBLIC_SITE_URL`: Frontend URL
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`: Google Analytics ID

## Deployment Workflow

### Automatic Deployments

- **Production**: Merges to `main` branch
- **Staging**: Merges to `staging` branch
- **Preview**: Pull requests
- **Development**: Other branches

### Manual Deployment

```bash
# Using GitHub Actions
# Go to Actions > Deploy Frontend to Vercel > Run workflow

# Using Vercel CLI
cd frontend
vercel --prod  # Production
vercel         # Preview
```

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to your project settings in Vercel
2. Navigate to Domains
3. Add your custom domain
4. Follow DNS configuration instructions

### 2. DNS Configuration

Add these records to your DNS provider:

#### For Apex Domain (yourdomain.com)

```
Type: A
Name: @
Value: 76.76.21.21
```

#### For Subdomain (www.yourdomain.com)

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## API Endpoint Configuration

The frontend automatically routes `/api/*` requests to your Lambda backend:

```javascript
// vercel.json rewrites configuration
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.yourdomain.com/:path*"
    }
  ]
}
```

## Preview Deployments

Every pull request automatically gets a preview deployment with:

- Unique URL (e.g., `coalition-pr-123.vercel.app`)
- Isolated environment
- Comment on PR with deployment details
- Automatic cleanup when PR is closed

## Performance Optimization

### Edge Functions

Vercel automatically optimizes Next.js with:

- Edge rendering for dynamic pages
- Static generation for static pages
- ISR (Incremental Static Regeneration) support
- Image optimization

### Caching

Static assets are cached with immutable headers:

- `/_next/static/*`: 1 year cache
- `/api/*`: No cache (proxied to Lambda)

### Regional Deployment

The project deploys to `iad1` (US East) by default, close to the Lambda functions in `us-east-1`.

## Monitoring

### Vercel Analytics

Enable in project settings for:

- Core Web Vitals
- Real User Monitoring
- Performance insights

### Logs

View logs in Vercel dashboard or CLI:

```bash
vercel logs --follow
```

## Rollback

### Via Vercel Dashboard

1. Go to project deployments
2. Find previous successful deployment
3. Click "Promote to Production"

### Via CLI

```bash
vercel rollback
```

## Cost Considerations

### Free Tier Includes

- 100GB bandwidth/month
- Unlimited preview deployments
- Automatic HTTPS
- Global CDN

### Pro Tier ($20/month)

- 1TB bandwidth
- Team collaboration
- Advanced analytics
- Priority support

## Troubleshooting

### Build Failures

Check build logs:

```bash
vercel logs --build
```

Common issues:

- Missing environment variables
- Node version mismatch
- Build memory limits

### 404 Errors

- Check `vercel.json` rewrites
- Verify API URL configuration
- Check Next.js routing

### CORS Issues

- API Gateway should handle CORS
- Check Zappa CORS configuration
- Verify allowed origins
