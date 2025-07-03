#!/bin/bash

# Run all password protection tests

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=================================================="
echo "Running Password Protection Tests"
echo "=================================================="
echo ""

TESTS_DIR="$(dirname "$0")"
FAILED=0

# Run shell script tests
echo "🔧 Shell Script Tests"
echo "--------------------------------------------------"

echo -n "Testing enable-password-protection.sh... "
if "$TESTS_DIR/test_enable_password_protection.sh" >/dev/null 2>&1; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  FAILED=$((FAILED + 1))
fi

echo -n "Testing disable-password-protection.sh... "
if "$TESTS_DIR/test_disable_password_protection.sh" >/dev/null 2>&1; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  FAILED=$((FAILED + 1))
fi

echo ""
echo "🐍 Python Tests (Unit)"
echo "--------------------------------------------------"
echo "Note: Run Django tests with: docker compose run --rm api python manage.py test coalition.middleware.tests"
echo ""

echo "🔧 Terraform Tests"
echo "--------------------------------------------------"
echo "Note: Run Terraform tests with: cd terraform/tests && go test ./... -v"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All shell script tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED test(s) failed${NC}"
  exit 1
fi
