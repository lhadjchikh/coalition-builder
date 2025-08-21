#!/bin/bash

# Script to verify and recreate ALB security group rules if missing
# Usage: ./verify-sg-rules.sh [environment]

set -e

ENV=${1:-prod}
PREFIX="coalition-${ENV}"

echo "Verifying security group rules for ${PREFIX}..."

# Get security group IDs
ALB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${PREFIX}-alb-sg" --query 'SecurityGroups[0].GroupId' --output text)
APP_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${PREFIX}-app-sg" --query 'SecurityGroups[0].GroupId' --output text)

if [ "$ALB_SG_ID" == "None" ] || [ "$APP_SG_ID" == "None" ]; then
  echo "Error: Could not find security groups"
  exit 1
fi

echo "ALB Security Group: $ALB_SG_ID"
echo "App Security Group: $APP_SG_ID"

# Function to check if a rule exists
check_rule() {
  local sg_id=$1
  local type=$2
  local port=$3
  local ref_sg=$4

  if [ "$type" == "egress" ]; then
    aws ec2 describe-security-group-rules \
      --filters "Name=group-id,Values=$sg_id" \
      "Name=is-egress,Values=true" \
      "Name=referenced-group-id,Values=$ref_sg" \
      --query "SecurityGroupRules[?FromPort==\`$port\` && ToPort==\`$port\`].GroupId" \
      --output text
  else
    aws ec2 describe-security-group-rules \
      --filters "Name=group-id,Values=$sg_id" \
      "Name=is-egress,Values=false" \
      "Name=referenced-group-id,Values=$ref_sg" \
      --query "SecurityGroupRules[?FromPort==\`$port\` && ToPort==\`$port\`].GroupId" \
      --output text
  fi
}

# Function to create a rule if it doesn't exist
create_rule_if_missing() {
  local sg_id=$1
  local type=$2
  local port=$3
  local ref_sg=$4
  local description=$5

  existing=$(check_rule "$sg_id" "$type" "$port" "$ref_sg")

  if [ -z "$existing" ]; then
    echo "Creating missing $type rule for port $port..."
    if [ "$type" == "egress" ]; then
      aws ec2 authorize-security-group-egress \
        --group-id "$sg_id" \
        --ip-permissions "IpProtocol=tcp,FromPort=$port,ToPort=$port,UserIdGroupPairs=[{GroupId=$ref_sg,Description='$description'}]" \
        --output text
    else
      aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --ip-permissions "IpProtocol=tcp,FromPort=$port,ToPort=$port,UserIdGroupPairs=[{GroupId=$ref_sg,Description='$description'}]" \
        --output text
    fi
    echo "✓ Created $type rule for port $port"
  else
    echo "✓ $type rule for port $port already exists"
  fi
}

# Check and create rules
echo ""
echo "Checking ALB egress rules..."
create_rule_if_missing "$ALB_SG_ID" "egress" "8000" "$APP_SG_ID" "ALB to application containers on port 8000"
create_rule_if_missing "$ALB_SG_ID" "egress" "3000" "$APP_SG_ID" "ALB to SSR container on port 3000"

echo ""
echo "Checking App ingress rules..."
create_rule_if_missing "$APP_SG_ID" "ingress" "8000" "$ALB_SG_ID" "Accept traffic from ALB on port 8000"
create_rule_if_missing "$APP_SG_ID" "ingress" "3000" "$ALB_SG_ID" "Accept traffic from ALB on port 3000"

echo ""
echo "All security group rules verified!"
