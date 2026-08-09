# Vercel Deployment Configuration

> **Historical reference.** The current workflow deploys production from `main`, development from `development`, and previews from pull requests; there is no `staging` branch deployment. Use [Deployment Workflows](deployment/workflows.md) as the operational runbook.

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

Add these as **repository variables**. The frontend deployment job does not
select a GitHub environment, so environment-scoped variables are not available
to it.

#### Development

- `DEVELOPMENT_API_URL`: `https://api-dev.yourdomain.com` or Lambda API Gateway URL
- `DEVELOPMENT_SITE_URL`: `https://dev.yourdomain.com` (optional; falls back to `PRODUCTION_SITE_URL`)

#### Staging

- `STAGING_API_URL`: `https://api-staging.yourdomain.com` or Lambda API Gateway URL
- `STAGING_SITE_URL`: `https://staging.yourdomain.com`

#### Production

- `PRODUCTION_API_URL`: `https://api.yourdomain.com` or Lambda API Gateway URL
- `PRODUCTION_SITE_URL`: `https://yourdomain.com`
- `PRODUCTION_DOMAIN`: `yourdomain.com` (for aliasing)

#### Shared build configuration

- `CLOUDFRONT_DOMAIN`: `d123456789.cloudfront.net` (required for image optimization)
- `AWS_STORAGE_BUCKET_NAME`: `your-assets-bucket` (required when images are served directly from S3)

#### Optional

- `GOOGLE_ANALYTICS_ID`: Your GA tracking ID

## Build-Time Environment

The GitHub Actions workflow passes the selected repository variables to
`vercel build` as:

- `API_URL` and `NEXT_PUBLIC_API_URL`: Backend API URL (Lambda/API Gateway)
- `NEXT_PUBLIC_ENVIRONMENT`: Current deployment environment
- `NEXT_PUBLIC_SITE_URL`: Frontend URL
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`: Google Analytics ID
- `CLOUDFRONT_DOMAIN`: CloudFront hostname allowed by Next.js image optimization
- `AWS_STORAGE_BUCKET_NAME`: S3 hostname allowed by Next.js image optimization

Next.js evaluates these values while creating the prebuilt artifact. The deploy
step cannot change them. For a manual `vercel build` outside GitHub Actions,
mirror the same values in the corresponding Vercel project environment and keep
them synchronized with the repository variables. Immediately before building,
refresh Vercel's local cache with `vercel pull --yes --environment=preview` or
`vercel pull --yes --environment=production`, as appropriate.

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

```text
Type: A
Name: @
Value: 76.76.21.21
```

#### For Subdomain (<www.yourdomain.com>)

```text
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## API Endpoint Configuration

The frontend proxies `/api/*` requests to the Lambda backend using **server-side rewrites** in `next.config.js`, controlled by the `API_URL` environment variable:

```javascript
// next.config.js rewrites configuration
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: `${process.env.API_URL || "http://localhost:8000"}/api/:path*`,
    },
  ];
},
```

Set `PRODUCTION_API_URL` and `DEVELOPMENT_API_URL` as described in
[Set GitHub Variables](#4-set-github-variables). The workflow passes the selected
value to `next.config.js` as `API_URL` during the build. For manual builds, mirror
that value in the corresponding Vercel project environment.

> **Note:** Do **not** add API rewrites to `vercel.json`. Vercel edge rewrites do not properly set the `Host` header for API Gateway URLs, which causes CloudFront to return `403 Forbidden`. The `next.config.js` server-side rewrites handle this correctly.

## Media Files

Uploaded media (organization logos, hero images, content block images) are stored in the S3 assets bucket under `media/`. The Django admin uploads files via `MediaStorage`, and the frontend fetches these URLs from the API.

If you are setting up a fresh deployment or migrating to a new environment, ensure that:

1. The S3 assets bucket exists and is accessible
2. Any required media files are uploaded to the `media/` prefix in the bucket
3. `AWS_STORAGE_BUCKET_NAME` is set in the Lambda GitHub environment and as a repository variable for the frontend build

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

- Verify `API_URL` is set correctly in Vercel dashboard
- Check `next.config.js` rewrites configuration
- Check Next.js routing

### CORS Issues

- API Gateway should handle CORS
- Check Zappa CORS configuration
- Verify allowed origins
