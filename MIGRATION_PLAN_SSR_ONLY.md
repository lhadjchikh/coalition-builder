# Migration Plan: Consolidate to SSR-Only Architecture

## Executive Summary
This plan outlines the migration from a dual frontend/SSR architecture to a simplified SSR-only deployment, eliminating the maintenance burden of supporting two frontend systems while preserving all functionality and test coverage.

## Current State Analysis

### What We Have Now
1. **Frontend (React SPA)**: Standalone React app with webpack build
2. **SSR (Next.js)**: Server-side rendered app using shared components
3. **Shared Components**: Common UI components used by both
4. **Dual Deployment Options**: `SSR_ENABLED=true/false` in Docker

### Pain Points
- Duplicate routing logic (React Router vs Next.js)
- Complex build configurations (webpack vs Next.js)
- Duplicate test suites
- Module resolution issues between environments
- Increased CI/CD complexity
- Documentation overhead

## Migration Strategy

### Phase 1: Consolidate and Restructure
**Timeline: 1-2 days**

#### 1.1 Rename and Consolidate Directories
- [ ] Rename `ssr/` directory to `frontend/`
- [ ] Move all `shared/components/` to `frontend/components/`
- [ ] Move all `shared/services/` to `frontend/services/`
- [ ] Move all `shared/styles/` to `frontend/styles/`
- [ ] Move all `shared/types/` to `frontend/types/`
- [ ] Move all `shared/utils/` to `frontend/utils/`
- [ ] Move all `shared/contexts/` to `frontend/contexts/`

#### 1.2 Migrate Remaining Frontend Components
- [ ] Move `frontend/src/components/EndorsementForm.tsx` to new `frontend/components/`
- [ ] Move `frontend/src/components/EndorsementsList.tsx` to new `frontend/components/`
- [ ] Move `frontend/src/components/GrowthIcon.tsx` to new `frontend/components/`
- [ ] Move any other frontend-specific components

#### 1.3 Update Import Paths
- [ ] Remove all `@shared/` import paths
- [ ] Update all imports to use relative paths or new alias structure
- [ ] Update `tsconfig.json` to remove shared directory references

#### 1.4 Test Coverage Migration
- [ ] Consolidate old frontend tests into new frontend/tests
- [ ] Merge test utilities from old frontend/src/tests/utils
- [ ] Ensure 100% feature parity in test coverage

### Phase 2: Remove Frontend-Specific Infrastructure
**Timeline: 1 day**

#### 2.1 Update Docker Configuration
- [ ] Remove `SSR_ENABLED` environment variable from all Docker files
- [ ] Update `Dockerfile` to remove old frontend build stages
- [ ] Rename `Dockerfile.ssr` to `Dockerfile.frontend`
- [ ] Update docker-compose.yml:
  - Change service name from `ssr` to `frontend`
  - Update build context and dockerfile references
  - Remove any frontend/SSR conditional logic
- [ ] Update nginx.conf to proxy to `frontend` service
- [ ] Delete old frontend Dockerfile stages

#### 2.2 Clean Up Build Systems
- [ ] Remove webpack.config.cjs
- [ ] Remove frontend-specific package.json scripts
- [ ] Delete React Router dependencies
- [ ] Consolidate package dependencies into SSR

#### 2.3 Update Terraform Infrastructure
- [ ] Remove `enable_ssr` variable from `terraform/variables.tf`
- [ ] Remove `enable_ssr` variable from `terraform/modules/compute/variables.tf`
- [ ] Update `terraform/modules/compute/main.tf`:
  - Always include SSR container in task definitions
  - Remove conditional logic for container definitions
  - Simplify CPU/memory allocation (no more conditional splits)
  - Always create SSR load balancer target group attachments
- [ ] Remove frontend ECR repository if exists
- [ ] Update `terraform/tests/`:
  - Remove `enable_ssr = false` from all test configurations
  - Update test assertions to expect SSR-only setup
- [ ] Update terraform module documentation

### Phase 3: Update CI/CD Workflows
**Timeline: 1 day**

#### 3.1 Consolidate Workflows
- [ ] Merge test_frontend.yml into test_ssr.yml
- [ ] Delete check_frontend.yml
- [ ] Update test_fullstack.yml to only test SSR
- [ ] Update lint_typescript.yml to focus on SSR

#### 3.2 Update Build Pipelines
- [ ] Remove frontend build steps from deploy_app.yml
- [ ] Update Docker image builds
- [ ] Simplify deployment scripts

### Phase 4: Documentation Updates
**Timeline: 1 day**

#### 4.1 Update README and Docs
- [ ] Remove references to dual deployment modes
- [ ] Update architecture diagrams
- [ ] Simplify development setup instructions
- [ ] Update deployment guides

#### 4.2 Update Developer Documentation
- [ ] Remove frontend-specific development guides
- [ ] Update component development docs
- [ ] Consolidate testing documentation

## File Structure After Migration

```
coalition-builder/
├── backend/              # Django API (unchanged)
├── frontend/             # Next.js SSR App (renamed from ssr/)
│   ├── app/             # Next.js app directory (pages)
│   ├── components/      # All UI components (consolidated)
│   ├── services/        # API clients
│   ├── styles/          # All styles
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── public/          # Static assets
│   └── tests/           # All frontend tests
├── terraform/           # Infrastructure (updated for SSR-only)
└── docs/               # Documentation (updated)
```

**Note**: The `shared/` directory will be eliminated, with all code consolidated into the new `frontend/` directory (which is actually the SSR app).

## Benefits of Migration

1. **Simplified Development**
   - Single routing system (Next.js)
   - One build configuration
   - Unified component architecture

2. **Reduced Maintenance**
   - Single test suite to maintain
   - One set of dependencies
   - Simplified CI/CD pipeline

3. **Better Performance**
   - SSR provides better SEO
   - Faster initial page loads
   - Better Core Web Vitals

4. **Developer Experience**
   - Clearer architecture
   - Easier onboarding
   - Less context switching

## Risk Mitigation

1. **Feature Parity**: Ensure all frontend features work in SSR
2. **Test Coverage**: Maintain or improve test coverage during migration
3. **Rollback Plan**: Tag current version before migration
4. **Staging Validation**: Test thoroughly in staging environment

## Success Criteria

- [ ] All features work in SSR-only mode
- [ ] Test coverage ≥ current levels
- [ ] CI/CD pipeline simplified and passing
- [ ] Documentation updated and accurate
- [ ] No references to frontend-only mode remain
- [ ] Development setup time reduced by 50%

## Implementation Checklist

### Day 1: Component Migration
- [ ] Move all frontend-specific components to shared
- [ ] Update import paths
- [ ] Run and fix all tests
- [ ] Migrate frontend routing logic to Next.js:
  - `/` → `app/page.tsx`
  - `/campaigns` → `app/campaigns/page.tsx`
  - `/campaigns/:name` → `app/campaigns/[name]/page.tsx`
  - `/about` → `app/about/page.tsx`
  - `/contact` → `app/contact/page.tsx`
  - `/privacy` → `app/privacy/page.tsx`
  - `/terms` → `app/terms/page.tsx`

### Day 2: Infrastructure Updates
- [ ] Update Docker configurations
- [ ] Remove frontend build artifacts
- [ ] Update environment variables

### Day 3: CI/CD Updates
- [ ] Consolidate workflows
- [ ] Update deployment scripts
- [ ] Verify all pipelines pass

### Day 4: Documentation & Cleanup
- [ ] Update all documentation
- [ ] Remove unused dependencies
- [ ] Archive frontend directory
- [ ] Final testing and validation

## Post-Migration Cleanup

1. Delete old `frontend/` directory (after migration complete)
2. Delete `shared/` directory (after consolidation)
3. Remove unused npm packages
4. Update .gitignore to remove old paths
5. Remove frontend-specific environment variables
6. Update monitoring and alerts
7. Update all documentation references:
   - Change `ssr` → `frontend` throughout docs
   - Remove references to `shared/` directory
   - Update architecture diagrams
8. Update backend CORS settings if needed
9. Search and replace all occurrences in codebase:
   - `ssr` service → `frontend` service
   - `@shared/` imports → relative imports
   - `SSR_ENABLED` → remove entirely
   - `enable_ssr` → remove from Terraform

## Notes

- Keep shared components modular for future flexibility
- Maintain clear separation between SSR-specific and shared code
- Consider creating a migration branch for safety
- Document any breaking changes for existing deployments