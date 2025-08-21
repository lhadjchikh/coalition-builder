# Security Group Rules Fix Documentation

## Problem Description

The ALB security group rules were being repeatedly destroyed during `deploy_infra` workflow runs, causing the following errors:

1. `AWS resource not found during refresh` warnings for ingress rules
2. `InvalidSecurityGroupRuleId.NotFound` errors when trying to update tags on non-existent egress rules
3. Manual imports to the terraform state would not persist through subsequent runs

## Root Cause

The issue stemmed from:
1. Security group rules being defined as separate resources (`aws_vpc_security_group_egress_rule` and `aws_vpc_security_group_ingress_rule`)
2. Missing lifecycle management causing rules to be destroyed without proper recreation
3. Potential race conditions between security group creation and rule attachment
4. AWS occasionally cleaning up orphaned rules that lost their parent security group references

## Implemented Solution

### 1. Added Lifecycle Management (modules/security/main.tf)

Each security group rule now includes:
- `create_before_destroy = true` to ensure new rules are created before old ones are destroyed
- Explicit tags for better tracking
- Proper dependencies on both security groups and a null resource trigger

### 2. Added Verification Step in CI/CD (.github/workflows/deploy_infra.yml)

Before running `terraform apply`, the workflow now:
- Checks if critical security group rules exist in AWS
- Forces a targeted terraform refresh if rules are missing
- Provides clear warnings in the GitHub Actions output

### 3. Created Manual Verification Script (scripts/verify-sg-rules.sh)

A standalone script that can:
- Check for missing security group rules
- Automatically recreate them if needed
- Be run manually or integrated into other workflows

## Usage

### Automatic Fix (via CI/CD)
The fix is automatically applied during the `deploy_infra` workflow. No manual intervention required.

### Manual Verification
```bash
cd terraform
./scripts/verify-sg-rules.sh prod
```

### Force Recreation of Rules
If rules are still missing after deployment:
```bash
cd terraform
terraform refresh
terraform apply -target=module.security.aws_vpc_security_group_egress_rule.alb_to_api \
  -target=module.security.aws_vpc_security_group_egress_rule.alb_to_app \
  -target=module.security.aws_vpc_security_group_ingress_rule.api_from_alb \
  -target=module.security.aws_vpc_security_group_ingress_rule.app_from_alb
```

## Monitoring

Watch for these indicators in the GitHub Actions logs:
- ✅ "All critical security group rules are present" - Everything is working correctly
- ⚠️ "Missing ALB egress rules detected" - Rules will be recreated automatically
- ⚠️ "Missing APP ingress rules detected" - Rules will be recreated automatically

## Prevention

The combination of lifecycle management, explicit dependencies, and pre-apply verification should prevent this issue from recurring. The rules are now:
1. Protected from accidental destruction via lifecycle blocks
2. Properly ordered via dependency management
3. Verified before each deployment
4. Tagged for better tracking in AWS

## Related Files

- `terraform/modules/security/main.tf` - Security group and rule definitions
- `.github/workflows/deploy_infra.yml` - CI/CD workflow with verification step
- `terraform/scripts/verify-sg-rules.sh` - Manual verification script