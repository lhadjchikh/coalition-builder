#!/bin/bash

# Test script for enable-password-protection.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Copy the script to test directory
SCRIPT_PATH="$(dirname "$0")/../enable-password-protection.sh"
cp "$SCRIPT_PATH" ./enable-password-protection.sh
chmod +x ./enable-password-protection.sh

# Also need the generate-htpasswd.sh script
cp "$(dirname "$0")/../generate-htpasswd.sh" ./generate-htpasswd.sh
chmod +x ./generate-htpasswd.sh

echo "Running tests in $TEST_DIR"

# Test 1: Script requires password argument
echo -n "Test 1: Script requires password argument... "
if ./enable-password-protection.sh 2>&1 | grep -q "Error: Password is required"; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 2: Script exits with error when no password provided
echo -n "Test 2: Script exits with non-zero when no password... "
if ! ./enable-password-protection.sh 2>/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 3: Script creates .env file when it doesn't exist
echo -n "Test 3: Script creates .env file... "
rm -f .env
# Clean up any existing htpasswd to avoid warnings
rm -f .htpasswd
./enable-password-protection.sh testuser testpass >/dev/null 2>&1
if [ -f .env ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 4: Script sets correct environment variables
echo -n "Test 4: Script sets correct environment variables... "
if grep -q "SITE_PASSWORD_ENABLED=true" .env &&
  grep -q "SITE_PASSWORD=testpass" .env &&
  grep -q "NGINX_CONFIG=./nginx.protected.conf" .env; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  cat .env
  exit 1
fi

# Test 5: Script creates .htpasswd file
echo -n "Test 5: Script creates .htpasswd file... "
if [ -f .htpasswd ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 6: Script updates existing .env file
echo -n "Test 6: Script updates existing .env file... "
echo "EXISTING_VAR=value" >.env
./enable-password-protection.sh newuser newpass >/dev/null 2>&1
if grep -q "EXISTING_VAR=value" .env &&
  grep -q "SITE_PASSWORD=newpass" .env; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 7: Script removes old password settings before adding new ones
echo -n "Test 7: Script removes old settings... "
./enable-password-protection.sh user1 pass1 >/dev/null 2>&1
OLD_COUNT=$(grep -c "SITE_PASSWORD_ENABLED" .env || true)
./enable-password-protection.sh user2 pass2 >/dev/null 2>&1
NEW_COUNT=$(grep -c "SITE_PASSWORD_ENABLED" .env || true)
if [ "$OLD_COUNT" -eq "$NEW_COUNT" ] && [ "$NEW_COUNT" -eq 1 ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  echo "Found $NEW_COUNT instances of SITE_PASSWORD_ENABLED, expected 1"
  exit 1
fi

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo -e "\n${GREEN}All tests passed!${NC}"
