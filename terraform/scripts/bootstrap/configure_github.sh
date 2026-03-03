#!/bin/bash
# Configure GitHub repository environments with AWS account IDs and variables.
# Uses the gh CLI to create environments and set variables/secrets.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DEFAULT_REGION="us-east-1"

usage() {
  cat <<EOF
Configure GitHub repository environments with AWS account IDs and variables.

Usage: $0 [OPTIONS]

OPTIONS:
    --repo ORG/REPO           GitHub repository (e.g., my-org/coalition-builder) (required)
    --shared-account-id ID    AWS account ID for the shared account (required)
    --prod-account-id ID      AWS account ID for the prod account (required)
    --dev-account-id ID       AWS account ID for the dev account (required)
    --region REGION           AWS region (default: $DEFAULT_REGION)
    -h, --help                Show this help message

EXAMPLES:
    $0 \\
      --repo my-org/coalition-builder \\
      --shared-account-id SHARED_ACCOUNT_ID \\
      --prod-account-id PROD_ACCOUNT_ID \\
      --dev-account-id DEV_ACCOUNT_ID

EOF
}

# Parse arguments
REPO=""
SHARED_ACCOUNT_ID=""
PROD_ACCOUNT_ID=""
DEV_ACCOUNT_ID=""
REGION="$DEFAULT_REGION"

while [[ $# -gt 0 ]]; do
  case $1 in
    --repo)
      REPO="$2"
      shift 2
      ;;
    --shared-account-id)
      SHARED_ACCOUNT_ID="$2"
      shift 2
      ;;
    --prod-account-id)
      PROD_ACCOUNT_ID="$2"
      shift 2
      ;;
    --dev-account-id)
      DEV_ACCOUNT_ID="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

# Validate required arguments
missing=()
[[ -z "$REPO" ]] && missing+=("--repo")
[[ -z "$SHARED_ACCOUNT_ID" ]] && missing+=("--shared-account-id")
[[ -z "$PROD_ACCOUNT_ID" ]] && missing+=("--prod-account-id")
[[ -z "$DEV_ACCOUNT_ID" ]] && missing+=("--dev-account-id")

if [[ ${#missing[@]} -gt 0 ]]; then
  log_error "Missing required arguments: ${missing[*]}"
  usage
  exit 1
fi

# Check gh CLI is available and authenticated
if ! command -v gh >/dev/null 2>&1; then
  log_error "gh CLI is not installed. Install from: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  log_error "gh CLI is not authenticated. Run: gh auth login"
  exit 1
fi

log_info "Configuring GitHub environments for $REPO"

# Function to create/update a GitHub environment
configure_environment() {
  local env_name="$1"
  local account_id="$2"
  local region="$3"

  log_info "Configuring environment: $env_name"

  # Create the environment (PUT is idempotent)
  gh api \
    --method PUT \
    "repos/${REPO}/environments/${env_name}" \
    --silent

  log_success "Environment created: $env_name"

  # Set environment variables
  gh variable set AWS_ACCOUNT_ID --env "$env_name" --repo "$REPO" --body "$account_id"
  log_success "  Set AWS_ACCOUNT_ID=$account_id"

  gh variable set ENVIRONMENT --env "$env_name" --repo "$REPO" --body "$env_name"
  log_success "  Set ENVIRONMENT=$env_name"

  gh variable set AWS_REGION --env "$env_name" --repo "$REPO" --body "$region"
  log_success "  Set AWS_REGION=$region"
}

# Configure each environment
configure_environment "shared" "$SHARED_ACCOUNT_ID" "$REGION"
configure_environment "prod" "$PROD_ACCOUNT_ID" "$REGION"
configure_environment "dev" "$DEV_ACCOUNT_ID" "$REGION"

echo
log_success "GitHub environments configured for $REPO"
log_info "Verify at: https://github.com/$REPO/settings/environments"
