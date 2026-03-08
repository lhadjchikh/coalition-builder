#!/bin/bash
# Tests for bootstrap scripts and CloudFormation templates.
# Validates: shellcheck linting, YAML structure, naming conventions,
# and consistency with the Terraform github-oidc module.
#
# Usage: ./test_bootstrap.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS=0
FAIL=0

pass() {
  echo -e "  ${GREEN}PASS${NC} $1"
  PASS=$((PASS + 1))
}

fail() {
  echo -e "  ${RED}FAIL${NC} $1"
  FAIL=$((FAIL + 1))
}

# ============================================================
# ShellCheck tests
# ============================================================
echo -e "${BLUE}ShellCheck linting${NC}"

for script in bootstrap_account.sh configure_github.sh bootstrap_all.sh; do
  if shellcheck "${SCRIPT_DIR}/${script}"; then
    pass "${script} passes shellcheck"
  else
    fail "${script} fails shellcheck"
  fi
done

# ============================================================
# CloudFormation YAML structure tests
# ============================================================
echo -e "\n${BLUE}CloudFormation template validation${NC}"

# Python helper script that handles CloudFormation YAML tags (!Sub, !If, etc.)
CFN_YAML_HELPER=$(cat <<'PYEOF'
import yaml, sys, json

# Register constructors for CloudFormation intrinsic functions
def cfn_constructor(loader, tag_suffix, node):
    if isinstance(node, yaml.ScalarNode):
        return {("Fn::" + tag_suffix) if tag_suffix != "Ref" else tag_suffix: loader.construct_scalar(node)}
    elif isinstance(node, yaml.SequenceNode):
        return {("Fn::" + tag_suffix) if tag_suffix != "Ref" else tag_suffix: loader.construct_sequence(node)}
    elif isinstance(node, yaml.MappingNode):
        return {("Fn::" + tag_suffix) if tag_suffix != "Ref" else tag_suffix: loader.construct_mapping(node)}

for tag in ["Sub", "Ref", "If", "Equals", "GetAtt", "Select", "Join", "Split", "Not", "And", "Or", "Condition"]:
    yaml.SafeLoader.add_constructor(
        "!" + tag,
        lambda loader, node, t=tag: cfn_constructor(loader, t, node)
    )

def load_cfn(path):
    with open(path) as f:
        return yaml.safe_load(f)

def navigate(data, keys):
    for k in keys:
        if isinstance(k, int):
            data = data[k]
        else:
            data = data[k]
    return data

if __name__ == "__main__":
    cmd = sys.argv[1]
    path = sys.argv[2]
    data = load_cfn(path)
    if cmd == "get":
        keys = json.loads(sys.argv[3])
        try:
            result = navigate(data, keys)
            if result is None:
                sys.exit(1)
            if isinstance(result, (dict, list)):
                print(json.dumps(result))
            else:
                print(result)
        except (KeyError, TypeError, IndexError):
            sys.exit(1)
    elif cmd == "has":
        keys = json.loads(sys.argv[3])
        try:
            result = navigate(data, keys)
            sys.exit(0 if result is not None else 1)
        except (KeyError, TypeError, IndexError):
            sys.exit(1)
    elif cmd == "valid":
        sys.exit(0)
PYEOF
)

yaml_query() {
  local file="$1"
  local keys_json="$2"
  python3 -c "$CFN_YAML_HELPER" get "$file" "$keys_json"
}

yaml_has_key() {
  local file="$1"
  local keys_json="$2"
  python3 -c "$CFN_YAML_HELPER" has "$file" "$keys_json" 2>/dev/null
}


# --- github-oidc-role.cfn.yml ---
OIDC_TEMPLATE="${SCRIPT_DIR}/github-oidc-role.cfn.yml"

if yaml_has_key "$OIDC_TEMPLATE" '["AWSTemplateFormatVersion"]'; then
  pass "github-oidc-role.cfn.yml is valid YAML with AWSTemplateFormatVersion"
else
  fail "github-oidc-role.cfn.yml missing or invalid AWSTemplateFormatVersion"
fi

if yaml_has_key "$OIDC_TEMPLATE" '["Parameters", "Environment"]'; then
  pass "github-oidc-role.cfn.yml has Environment parameter"
else
  fail "github-oidc-role.cfn.yml missing Environment parameter"
fi

if yaml_has_key "$OIDC_TEMPLATE" '["Parameters", "GitHubOrg"]'; then
  pass "github-oidc-role.cfn.yml has GitHubOrg parameter"
else
  fail "github-oidc-role.cfn.yml missing GitHubOrg parameter"
fi

if yaml_has_key "$OIDC_TEMPLATE" '["Parameters", "GitHubRepo"]'; then
  pass "github-oidc-role.cfn.yml has GitHubRepo parameter"
else
  fail "github-oidc-role.cfn.yml missing GitHubRepo parameter"
fi

if yaml_has_key "$OIDC_TEMPLATE" '["Resources", "GitHubOIDCProvider"]'; then
  pass "github-oidc-role.cfn.yml has GitHubOIDCProvider resource"
else
  fail "github-oidc-role.cfn.yml missing GitHubOIDCProvider resource"
fi

if yaml_has_key "$OIDC_TEMPLATE" '["Resources", "GitHubActionsRole"]'; then
  pass "github-oidc-role.cfn.yml has GitHubActionsRole resource"
else
  fail "github-oidc-role.cfn.yml missing GitHubActionsRole resource"
fi

if yaml_has_key "$OIDC_TEMPLATE" '["Outputs", "OIDCProviderArn"]'; then
  pass "github-oidc-role.cfn.yml has OIDCProviderArn output"
else
  fail "github-oidc-role.cfn.yml missing OIDCProviderArn output"
fi

if yaml_has_key "$OIDC_TEMPLATE" '["Outputs", "RoleArn"]'; then
  pass "github-oidc-role.cfn.yml has RoleArn output"
else
  fail "github-oidc-role.cfn.yml missing RoleArn output"
fi

# Verify OIDC provider URL matches Terraform module
OIDC_URL=$(yaml_query "$OIDC_TEMPLATE" '["Resources", "GitHubOIDCProvider", "Properties", "Url"]')
if [[ "$OIDC_URL" == "https://token.actions.githubusercontent.com" ]]; then
  pass "OIDC provider URL matches Terraform module"
else
  fail "OIDC provider URL mismatch (got: $OIDC_URL)"
fi

# Verify audience matches Terraform module
OIDC_AUD=$(yaml_query "$OIDC_TEMPLATE" '["Resources", "GitHubOIDCProvider", "Properties", "ClientIdList", 0]')
if [[ "$OIDC_AUD" == "sts.amazonaws.com" ]]; then
  pass "OIDC audience matches Terraform module"
else
  fail "OIDC audience mismatch (got: $OIDC_AUD)"
fi

# Verify thumbprint matches Terraform module
OIDC_THUMB=$(yaml_query "$OIDC_TEMPLATE" '["Resources", "GitHubOIDCProvider", "Properties", "ThumbprintList", 0]')
if [[ "$OIDC_THUMB" == "ffffffffffffffffffffffffffffffffffffffff" ]]; then
  pass "OIDC thumbprint matches Terraform module"
else
  fail "OIDC thumbprint mismatch (got: $OIDC_THUMB)"
fi

# Verify GitHubOrg has no hardcoded default (should be a required parameter)
if ! yaml_has_key "$OIDC_TEMPLATE" '["Parameters", "GitHubOrg", "Default"]'; then
  pass "GitHubOrg has no hardcoded default"
else
  fail "GitHubOrg should not have a hardcoded default"
fi

# Verify GitHubRepo has no hardcoded default (should be a required parameter)
if ! yaml_has_key "$OIDC_TEMPLATE" '["Parameters", "GitHubRepo", "Default"]'; then
  pass "GitHubRepo has no hardcoded default"
else
  fail "GitHubRepo should not have a hardcoded default"
fi

# Verify Environment allowed values
ENV_ALLOWED=$(yaml_query "$OIDC_TEMPLATE" '["Parameters", "Environment", "AllowedValues"]')
if [[ "$ENV_ALLOWED" == '["dev", "prod", "shared"]' || "$ENV_ALLOWED" == '["shared", "prod", "dev"]' ]]; then
  pass "Environment parameter allows shared, prod, dev"
else
  fail "Environment parameter allowed values wrong (got: $ENV_ALLOWED)"
fi

# --- peering-role.cfn.yml ---
PEERING_TEMPLATE="${SCRIPT_DIR}/peering-role.cfn.yml"

if yaml_has_key "$PEERING_TEMPLATE" '["AWSTemplateFormatVersion"]'; then
  pass "peering-role.cfn.yml is valid YAML with AWSTemplateFormatVersion"
else
  fail "peering-role.cfn.yml missing or invalid AWSTemplateFormatVersion"
fi

if yaml_has_key "$PEERING_TEMPLATE" '["Resources", "VPCPeeringAccepterRole"]'; then
  pass "peering-role.cfn.yml has VPCPeeringAccepterRole resource"
else
  fail "peering-role.cfn.yml missing VPCPeeringAccepterRole resource"
fi

if yaml_has_key "$PEERING_TEMPLATE" '["Parameters", "ProdAccountId"]'; then
  pass "peering-role.cfn.yml has ProdAccountId parameter"
else
  fail "peering-role.cfn.yml missing ProdAccountId parameter"
fi

if yaml_has_key "$PEERING_TEMPLATE" '["Parameters", "DevAccountId"]'; then
  pass "peering-role.cfn.yml has DevAccountId parameter"
else
  fail "peering-role.cfn.yml missing DevAccountId parameter"
fi

if yaml_has_key "$PEERING_TEMPLATE" '["Parameters", "HostedZoneId"]'; then
  pass "peering-role.cfn.yml has HostedZoneId parameter"
else
  fail "peering-role.cfn.yml missing HostedZoneId parameter"
fi

# Verify ProdAccountId has no hardcoded default (should be a required parameter)
if ! yaml_has_key "$PEERING_TEMPLATE" '["Parameters", "ProdAccountId", "Default"]'; then
  pass "ProdAccountId has no hardcoded default"
else
  fail "ProdAccountId should not have a hardcoded default"
fi

# Verify DevAccountId has no hardcoded default (should be a required parameter)
if ! yaml_has_key "$PEERING_TEMPLATE" '["Parameters", "DevAccountId", "Default"]'; then
  pass "DevAccountId has no hardcoded default"
else
  fail "DevAccountId should not have a hardcoded default"
fi

# Verify peering role name matches what prod/dev Terraform expects
PEERING_ROLE_NAME=$(yaml_query "$PEERING_TEMPLATE" '["Resources", "VPCPeeringAccepterRole", "Properties", "RoleName"]')
if [[ "$PEERING_ROLE_NAME" == "vpc-peering-accepter" ]]; then
  pass "Peering role name is vpc-peering-accepter"
else
  fail "Peering role name mismatch (got: $PEERING_ROLE_NAME)"
fi

# Verify dns-record-writer policy scopes Route53 to specific hosted zone
DNS_POLICY_STMTS=$(yaml_query "$PEERING_TEMPLATE" '["Resources", "VPCPeeringAccepterRole", "Properties", "Policies", 1, "PolicyDocument", "Statement"]')
if echo "$DNS_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    res = json.dumps(s.get('Resource', ''))
    if res == '\"*\"' or res == '[\"*\"]':
        sys.exit(1)
sys.exit(0)
" 2>/dev/null; then
  pass "dns-record-writer Route53 resources are not wildcard (*)"
else
  fail "dns-record-writer Route53 resources should be scoped to specific hosted zone"
fi

# Verify peering role has required EC2 permissions
PEERING_ACTIONS=$(yaml_query "$PEERING_TEMPLATE" '["Resources", "VPCPeeringAccepterRole", "Properties", "Policies", 0, "PolicyDocument", "Statement", 0, "Action"]')
for action in "ec2:AcceptVpcPeeringConnection" "ec2:DescribeVpcPeeringConnections" "ec2:CreateRoute" "ec2:DescribeRouteTables" "ec2:DescribeVpcs"; do
  if echo "$PEERING_ACTIONS" | grep -qF "$action"; then
    pass "Peering role has $action permission"
  else
    fail "Peering role missing $action permission"
  fi
done

# ============================================================
# Script content tests
# ============================================================
echo -e "\n${BLUE}Script content validation${NC}"

# Verify bootstrap_account.sh references correct bucket naming convention
if grep -q 'coalition-terraform-state-' "${SCRIPT_DIR}/bootstrap_account.sh"; then
  pass "bootstrap_account.sh uses coalition-terraform-state- bucket prefix"
else
  fail "bootstrap_account.sh missing coalition-terraform-state- bucket prefix"
fi

# Verify bootstrap_account.sh references correct DynamoDB table
if grep -q 'coalition-terraform-locks' "${SCRIPT_DIR}/bootstrap_account.sh"; then
  pass "bootstrap_account.sh uses coalition-terraform-locks table name"
else
  fail "bootstrap_account.sh missing coalition-terraform-locks table name"
fi

# Verify bootstrap_account.sh uses set -euo pipefail
if head -10 "${SCRIPT_DIR}/bootstrap_account.sh" | grep -q 'set -euo pipefail'; then
  pass "bootstrap_account.sh uses set -euo pipefail"
else
  fail "bootstrap_account.sh missing set -euo pipefail"
fi

# Verify bootstrap_account.sh deploys OIDC stack
if grep -q 'github-oidc-role.cfn.yml' "${SCRIPT_DIR}/bootstrap_account.sh"; then
  pass "bootstrap_account.sh deploys github-oidc-role.cfn.yml"
else
  fail "bootstrap_account.sh missing github-oidc-role.cfn.yml deployment"
fi

# Verify bootstrap_account.sh deploys peering stack for shared only
if grep -q 'peering-role.cfn.yml' "${SCRIPT_DIR}/bootstrap_account.sh"; then
  pass "bootstrap_account.sh deploys peering-role.cfn.yml"
else
  fail "bootstrap_account.sh missing peering-role.cfn.yml deployment"
fi

# Verify bootstrap_account.sh adds cross-account bucket policy for shared account
if grep -q 'put-bucket-policy' "${SCRIPT_DIR}/bootstrap_account.sh"; then
  pass "bootstrap_account.sh adds cross-account bucket policy for shared state"
else
  fail "bootstrap_account.sh missing cross-account bucket policy (prod/dev need read access to shared state)"
fi

# Verify configure_github.sh accepts --repo parameter
if grep -q '\-\-repo' "${SCRIPT_DIR}/configure_github.sh"; then
  pass "configure_github.sh accepts --repo parameter"
else
  fail "configure_github.sh missing --repo parameter"
fi

# Verify configure_github.sh sets expected variables
for var_name in AWS_ACCOUNT_ID ENVIRONMENT AWS_REGION; do
  if grep -q "$var_name" "${SCRIPT_DIR}/configure_github.sh"; then
    pass "configure_github.sh sets $var_name"
  else
    fail "configure_github.sh missing $var_name"
  fi
done

# Verify bootstrap_all.sh handles all three environments
for env in shared prod dev; do
  if grep -q "\-\-environment ${env}" "${SCRIPT_DIR}/bootstrap_all.sh"; then
    pass "bootstrap_all.sh bootstraps ${env} environment"
  else
    fail "bootstrap_all.sh missing ${env} environment"
  fi
done

# Verify bootstrap_all.sh prints terraform import commands
if grep -q 'terraform import' "${SCRIPT_DIR}/bootstrap_all.sh"; then
  pass "bootstrap_all.sh prints terraform import commands"
else
  fail "bootstrap_all.sh missing terraform import commands"
fi

# Verify bootstrap_all.sh imports both OIDC provider and role
if grep -q 'aws_iam_openid_connect_provider' "${SCRIPT_DIR}/bootstrap_all.sh"; then
  pass "bootstrap_all.sh imports OIDC provider"
else
  fail "bootstrap_all.sh missing OIDC provider import"
fi

if grep -q 'aws_iam_role.github_actions' "${SCRIPT_DIR}/bootstrap_all.sh"; then
  pass "bootstrap_all.sh imports GitHub Actions role"
else
  fail "bootstrap_all.sh missing GitHub Actions role import"
fi

# Verify all scripts are executable
for script in bootstrap_account.sh configure_github.sh bootstrap_all.sh; do
  if [[ -x "${SCRIPT_DIR}/${script}" ]]; then
    pass "${script} is executable"
  else
    fail "${script} is not executable"
  fi
done

# ============================================================
# OIDC IAM scoping tests
# ============================================================
echo -e "\n${BLUE}OIDC IAM permission scoping${NC}"

# Verify SharedAccountId parameter exists (for STS scoping)
if yaml_has_key "$OIDC_TEMPLATE" '["Parameters", "SharedAccountId"]'; then
  pass "github-oidc-role.cfn.yml has SharedAccountId parameter"
else
  fail "github-oidc-role.cfn.yml missing SharedAccountId parameter"
fi

# Load infrastructure policy statements for subsequent checks
INFRA_POLICY_STMTS=$(yaml_query "$OIDC_TEMPLATE" '["Resources", "GitHubActionsRole", "Properties", "Policies", 1, "PolicyDocument", "Statement"]')

# Verify ecr:GetAuthorizationToken is in ServiceReadOnly (requires Resource: *)
if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    if s.get('Sid') == 'ServiceReadOnly':
        actions = s.get('Action', [])
        if 'ecr:GetAuthorizationToken' in actions:
            sys.exit(0)
        sys.exit(1)
sys.exit(1)
" 2>/dev/null; then
  pass "ServiceReadOnly includes ecr:GetAuthorizationToken"
else
  fail "ServiceReadOnly missing ecr:GetAuthorizationToken (requires Resource: *, needed for ECR login)"
fi

# Verify IAM is split into separate read and mutate statements
if echo "$INFRA_POLICY_STMTS" | grep -q '"Sid": "IAMReadOnly"'; then
  pass "IAM has separate IAMReadOnly statement"
else
  fail "IAM missing IAMReadOnly statement (read/mutate split)"
fi

if echo "$INFRA_POLICY_STMTS" | grep -q '"Sid": "IAMMutate"'; then
  pass "IAM has separate IAMMutate statement"
else
  fail "IAM missing IAMMutate statement (read/mutate split)"
fi

# Verify IAMMutate does NOT use Resource: "*"
# Find the IAMMutate statement and check its Resource is not "*"
if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    if s.get('Sid') == 'IAMMutate':
        resource = s.get('Resource', '*')
        if resource == '*' or resource == ['*']:
            sys.exit(1)
        sys.exit(0)
sys.exit(1)  # IAMMutate not found
" 2>/dev/null; then
  pass "IAMMutate Resource is not wildcard (*)"
else
  fail "IAMMutate Resource should be scoped, not wildcard (*)"
fi

# Verify IAMMutate includes github-actions-* role pattern (so the role can manage itself)
if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    if s.get('Sid') == 'IAMMutate':
        res_str = json.dumps(s.get('Resource', ''))
        if 'github-actions-' in res_str:
            sys.exit(0)
        sys.exit(1)
sys.exit(1)
" 2>/dev/null; then
  pass "IAMMutate includes github-actions-* role pattern"
else
  fail "IAMMutate missing github-actions-* role pattern (cannot manage its own OIDC role)"
fi

# Verify EC2 is split into read and mutate statements
if echo "$INFRA_POLICY_STMTS" | grep -q '"Sid": "EC2ReadOnly"'; then
  pass "EC2 has separate EC2ReadOnly statement"
else
  fail "EC2 missing EC2ReadOnly statement (read/mutate split)"
fi

if echo "$INFRA_POLICY_STMTS" | grep -q '"Sid": "EC2Mutate"'; then
  pass "EC2 has separate EC2Mutate statement"
else
  fail "EC2 missing EC2Mutate statement (read/mutate split)"
fi

# Verify EC2Mutate uses account-scoped resource ARN
if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    if s.get('Sid') == 'EC2Mutate':
        resource = s.get('Resource', '*')
        res_str = json.dumps(resource)
        if 'AccountId' in res_str or 'account_id' in res_str:
            sys.exit(0)
        else:
            sys.exit(1)
sys.exit(1)
" 2>/dev/null; then
  pass "EC2Mutate uses account-scoped resource ARN"
else
  fail "EC2Mutate should use account-scoped resource ARN"
fi

# Verify account-scoped services use ${AWS::AccountId} in resource ARNs
for sid in RDS Lambda ECR SecretsManager SSM SNS CloudWatch CloudFront WAF SES ACM KMS Location Budgets; do
  if echo "$INFRA_POLICY_STMTS" | grep -q "\"Sid\": \"$sid\""; then
    # Check that the statement's Resource contains AWS::AccountId reference
    if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    if s.get('Sid') == '$sid':
        resource = s.get('Resource', '*')
        res_str = json.dumps(resource)
        if 'AccountId' in res_str or 'account_id' in res_str:
            sys.exit(0)
        else:
            sys.exit(1)
sys.exit(1)
" 2>/dev/null; then
      pass "$sid statement uses account-scoped resource ARN"
    else
      fail "$sid statement should use account-scoped resource ARN (not *)"
    fi
  fi
done

# Verify S3 mutate is not wildcard-scoped (s3:* on Resource "*" is too broad)
if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    sid = s.get('Sid', '')
    if sid == 'S3' or sid == 'S3Mutate':
        actions = s.get('Action', [])
        resource = s.get('Resource', '')
        has_wildcard_action = 's3:*' in actions or actions == 's3:*'
        has_wildcard_resource = resource == '*' or resource == ['*']
        if has_wildcard_action and has_wildcard_resource:
            sys.exit(1)
sys.exit(0)
" 2>/dev/null; then
  pass "S3 mutate actions are not wildcard-scoped"
else
  fail "S3 statement grants s3:* on Resource * (should scope mutate to project buckets)"
fi

# Verify CloudControlAPI statement exists (required by awscc provider)
if echo "$INFRA_POLICY_STMTS" | grep -q '"Sid": "CloudControlAPI"'; then
  pass "Infrastructure policy has CloudControlAPI statement"
else
  fail "Infrastructure policy missing CloudControlAPI statement (required by awscc provider)"
fi

# Verify IAMReadOnly includes iam:GetUser (needed for SES IAM user management)
if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    if s.get('Sid') == 'IAMReadOnly':
        actions = s.get('Action', [])
        if 'iam:GetUser' in actions:
            sys.exit(0)
        sys.exit(1)
sys.exit(1)
" 2>/dev/null; then
  pass "IAMReadOnly includes iam:GetUser"
else
  fail "IAMReadOnly missing iam:GetUser (needed for SES IAM user management)"
fi

# Verify IAMMutate includes IAM user actions (needed for SES SMTP user)
if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    if s.get('Sid') == 'IAMMutate':
        actions = s.get('Action', [])
        if 'iam:CreateUser' in actions and 'iam:CreateAccessKey' in actions:
            sys.exit(0)
        sys.exit(1)
sys.exit(1)
" 2>/dev/null; then
  pass "IAMMutate includes IAM user management actions"
else
  fail "IAMMutate missing IAM user management actions (iam:CreateUser, iam:CreateAccessKey)"
fi

# Verify OIDC provider actions are in a separate statement scoped to GitHub provider
if echo "$INFRA_POLICY_STMTS" | grep -q '"Sid": "OIDCProviderMutate"'; then
  pass "OIDC provider actions in separate OIDCProviderMutate statement"
else
  fail "Missing OIDCProviderMutate statement (OIDC actions should be separate from IAMMutate)"
fi

# Verify OIDCProviderMutate is scoped to GitHub provider, not wildcard
if echo "$INFRA_POLICY_STMTS" | python3 -c "
import json, sys
stmts = json.load(sys.stdin)
for s in stmts:
    if s.get('Sid') == 'OIDCProviderMutate':
        res_str = json.dumps(s.get('Resource', ''))
        if 'token.actions.githubusercontent.com' in res_str:
            sys.exit(0)
        sys.exit(1)
sys.exit(1)
" 2>/dev/null; then
  pass "OIDCProviderMutate scoped to GitHub OIDC provider ARN"
else
  fail "OIDCProviderMutate should be scoped to token.actions.githubusercontent.com"
fi

# Verify iam:CreateOpenIDConnectProvider is NOT in any statement (bootstrap-only action)
if echo "$INFRA_POLICY_STMTS" | grep -q 'iam:CreateOpenIDConnectProvider'; then
  fail "iam:CreateOpenIDConnectProvider should not be in infrastructure policy (bootstrap-only)"
else
  pass "iam:CreateOpenIDConnectProvider not in infrastructure policy"
fi

# Verify iam:AttachUserPolicy is NOT in IAMMutate (prevents managed policy escalation)
if echo "$INFRA_POLICY_STMTS" | grep -q 'iam:AttachUserPolicy'; then
  fail "iam:AttachUserPolicy should not be in IAMMutate (escalation risk)"
else
  pass "iam:AttachUserPolicy not in IAMMutate"
fi

# Verify no STS statement with arn:aws:iam::*:role/ wildcard account
if echo "$INFRA_POLICY_STMTS" | grep -q 'arn:aws:iam::\*:role/'; then
  fail "STS statement should not use wildcard (*) account in IAM ARN"
else
  pass "No wildcard account in STS AssumeRole ARN"
fi

# ============================================================
# Naming consistency tests (CFN matches Terraform)
# ============================================================
echo -e "\n${BLUE}Naming consistency (CFN ↔ Terraform)${NC}"

# Role name pattern: github-actions-{environment}
# CFN !Sub produces {"Fn::Sub": "github-actions-${Environment}"} in our loader
ROLE_NAME_JSON=$(yaml_query "$OIDC_TEMPLATE" '["Resources", "GitHubActionsRole", "Properties", "RoleName"]')
# shellcheck disable=SC2016 # Intentional: literal CFN ${Environment} syntax
EXPECTED_ROLE='{"Fn::Sub": "github-actions-${Environment}"}'
if [[ "$ROLE_NAME_JSON" == "$EXPECTED_ROLE" ]]; then
  pass "CFN role name pattern matches Terraform (github-actions-\${Environment})"
else
  fail "CFN role name pattern mismatch (got: $ROLE_NAME_JSON)"
fi

# Terraform operations policy name: {environment}-terraform-operations
POLICY_NAME_JSON=$(yaml_query "$OIDC_TEMPLATE" '["Resources", "GitHubActionsRole", "Properties", "Policies", 0, "PolicyName"]')
# shellcheck disable=SC2016 # Intentional: literal CFN ${Environment} syntax
EXPECTED_POLICY='{"Fn::Sub": "${Environment}-terraform-operations"}'
if [[ "$POLICY_NAME_JSON" == "$EXPECTED_POLICY" ]]; then
  pass "CFN terraform-operations policy name matches Terraform module"
else
  fail "CFN terraform-operations policy name mismatch (got: $POLICY_NAME_JSON)"
fi

# ============================================================
# Summary
# ============================================================
echo
TOTAL=$((PASS + FAIL))
echo -e "${BLUE}Results: ${PASS}/${TOTAL} passed${NC}"

if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}${FAIL} test(s) failed${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed${NC}"
  exit 0
fi
