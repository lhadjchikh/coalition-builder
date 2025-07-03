#!/bin/bash

# Test script for disable-password-protection.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Copy the script to test directory
SCRIPT_PATH="$(dirname "$0")/../disable-password-protection.sh"
cp "$SCRIPT_PATH" ./disable-password-protection.sh
chmod +x ./disable-password-protection.sh

echo "Running tests in $TEST_DIR"

# Test 1: Script creates .env file when it doesn't exist
echo -n "Test 1: Script creates .env file when missing... "
rm -f .env
./disable-password-protection.sh >/dev/null 2>&1
if [ -f .env ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 2: Script sets protection to disabled
echo -n "Test 2: Script sets SITE_PASSWORD_ENABLED=false... "
if grep -q "SITE_PASSWORD_ENABLED=false" .env; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 3: Script removes existing password settings
echo -n "Test 3: Script removes existing password settings... "
cat >.env <<EOF
EXISTING_VAR=value
SITE_PASSWORD_ENABLED=true
SITE_PASSWORD=oldpassword
NGINX_CONFIG=./nginx.protected.conf
ANOTHER_VAR=another_value
EOF
./disable-password-protection.sh >/dev/null 2>&1
if ! grep -q "SITE_PASSWORD=oldpassword" .env &&
  ! grep -q "NGINX_CONFIG=./nginx.protected.conf" .env &&
  grep -q "EXISTING_VAR=value" .env &&
  grep -q "ANOTHER_VAR=another_value" .env; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  echo "Contents of .env:"
  cat .env
  exit 1
fi

# Test 4: Script doesn't duplicate settings
echo -n "Test 4: Script doesn't duplicate settings... "
./disable-password-protection.sh >/dev/null 2>&1
./disable-password-protection.sh >/dev/null 2>&1
COUNT=$(grep -c "SITE_PASSWORD_ENABLED" .env || true)
if [ "$COUNT" -eq 1 ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  echo "Found $COUNT instances of SITE_PASSWORD_ENABLED, expected 1"
  exit 1
fi

# Test 5: Script adds commented examples
echo -n "Test 5: Script adds commented password example... "
if grep -q "# SITE_PASSWORD=" .env; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo -e "\n${GREEN}All tests passed!${NC}"
