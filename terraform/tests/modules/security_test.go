package modules

import (
	"fmt"
	"testing"

	"terraform-tests/common"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

// TestSecurityModuleValidation runs validation-only tests that don't require AWS credentials
func TestSecurityModuleValidation(t *testing.T) {
	common.ValidateModuleStructure(t, "security")
}

func getSecurityTestVars() map[string]interface{} {
	return map[string]interface{}{
		"vpc_id":                   "vpc-12345678",
		"allowed_bastion_cidrs":    []string{"10.0.0.0/8"},
		"lambda_security_group_id": "sg-lambda123",
	}
}

func TestSecurityModuleCreatesDatabaseSecurityGroup(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/security")
	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/security", getSecurityTestVars())
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate Database security group
	dbSGID := terraform.Output(t, terraformOptions, "db_security_group_id")
	assert.NotEmpty(t, dbSGID)

	sg := common.GetSecurityGroupById(t, dbSGID, testConfig.AWSRegion)
	assert.Equal(t, "vpc-12345678", *sg.VpcId)

	expectedName := fmt.Sprintf("%s-db-sg", testConfig.Prefix)
	assert.Equal(t, expectedName, *sg.GroupName)

	// Check for PostgreSQL port rule
	hasPostgreSQLRule := false

	for _, permission := range sg.IpPermissions {
		if permission.FromPort != nil && permission.ToPort != nil && permission.IpProtocol != nil {
			if *permission.FromPort == 5432 && *permission.ToPort == 5432 && *permission.IpProtocol == "tcp" {
				hasPostgreSQLRule = true
				break
			}
		}
	}

	assert.True(t, hasPostgreSQLRule, "Database security group should allow PostgreSQL traffic")
}

func TestSecurityModuleCreatesBastionSecurityGroup(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/security")

	testVars := map[string]interface{}{
		"vpc_id":                   "vpc-12345678",
		"allowed_bastion_cidrs":    []string{"192.168.1.0/24", "10.0.0.0/8"},
		"lambda_security_group_id": "sg-lambda123",
	}

	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/security", testVars)
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate Bastion security group
	bastionSGID := terraform.Output(t, terraformOptions, "bastion_security_group_id")
	assert.NotEmpty(t, bastionSGID)

	sg := common.GetSecurityGroupById(t, bastionSGID, testConfig.AWSRegion)
	assert.Equal(t, "vpc-12345678", *sg.VpcId)

	expectedName := fmt.Sprintf("%s-bastion-sg", testConfig.Prefix)
	assert.Equal(t, expectedName, *sg.GroupName)

	// Check for SSH rule with restricted CIDR blocks
	hasSSHRule := false

	for _, permission := range sg.IpPermissions {
		if permission.FromPort != nil && permission.ToPort != nil && permission.IpProtocol != nil {
			if *permission.FromPort == 22 && *permission.ToPort == 22 && *permission.IpProtocol == "tcp" {
				hasSSHRule = true
				// Check CIDR blocks
				var cidrBlocks []string
				for _, ipRange := range permission.IpRanges {
					if ipRange.CidrIp != nil {
						cidrBlocks = append(cidrBlocks, *ipRange.CidrIp)
					}
				}
				// Should only allow traffic from specified CIDR blocks
				assert.Contains(t, cidrBlocks, "192.168.1.0/24")
				assert.Contains(t, cidrBlocks, "10.0.0.0/8")
				assert.NotContains(t, cidrBlocks, "0.0.0.0/0", "Bastion should not allow SSH from anywhere")
			}
		}
	}

	assert.True(t, hasSSHRule, "Bastion security group should allow SSH traffic")
}

func TestSecurityModuleCreatesWAF(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/security")
	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/security", getSecurityTestVars())
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate WAF Web ACL
	wafWebACLArn := terraform.Output(t, terraformOptions, "waf_web_acl_arn")
	assert.NotEmpty(t, wafWebACLArn)
	assert.Contains(t, wafWebACLArn, "arn:aws:wafv2:", "WAF Web ACL ARN should be valid WAFv2 ARN")
}

func TestSecurityModuleValidatesResourceTags(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/security")
	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/security", getSecurityTestVars())
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate database security group naming
	dbSGID := terraform.Output(t, terraformOptions, "db_security_group_id")
	dbSG := common.GetSecurityGroupById(t, dbSGID, testConfig.AWSRegion)
	common.ValidateResourceNaming(t, *dbSG.GroupName, testConfig.Prefix, "db-sg")

	// Validate bastion security group naming
	bastionSGID := terraform.Output(t, terraformOptions, "bastion_security_group_id")
	bastionSG := common.GetSecurityGroupById(t, bastionSGID, testConfig.AWSRegion)
	common.ValidateResourceNaming(t, *bastionSG.GroupName, testConfig.Prefix, "bastion-sg")
}

func TestSecurityModuleWithRestrictiveBastionCIDRs(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/security")

	// Test with very restrictive CIDR blocks
	testVars := map[string]interface{}{
		"vpc_id":                   "vpc-12345678",
		"allowed_bastion_cidrs":    []string{"203.0.113.0/24"}, // Single specific network
		"lambda_security_group_id": "sg-lambda123",
	}

	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/security", testVars)
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate bastion security group only allows the specific CIDR
	bastionSGID := terraform.Output(t, terraformOptions, "bastion_security_group_id")
	bastionSG := common.GetSecurityGroupById(t, bastionSGID, testConfig.AWSRegion)

	assert.NotNil(t, bastionSG, "Bastion security group should exist and be configured")

	// Check for SSH rule with restricted CIDR blocks
	hasSSHRule := false
	for _, permission := range bastionSG.IpPermissions {
		if permission.FromPort != nil && permission.ToPort != nil && permission.IpProtocol != nil {
			if *permission.FromPort == 22 && *permission.ToPort == 22 && *permission.IpProtocol == "tcp" {
				hasSSHRule = true
				// Collect CIDR blocks for SSH rule
				var cidrBlocks []string
				for _, ipRange := range permission.IpRanges {
					if ipRange.CidrIp != nil {
						cidrBlocks = append(cidrBlocks, *ipRange.CidrIp)
					}
				}
				// Should only allow traffic from the specific restrictive CIDR block
				assert.Contains(t, cidrBlocks, "203.0.113.0/24", "Should allow SSH from the specific test network")
				assert.NotContains(t, cidrBlocks, "0.0.0.0/0", "Should not allow SSH from anywhere")
				assert.NotContains(t, cidrBlocks, "10.0.0.0/8", "Should not allow SSH from the broader private network")
			}
		}
	}
	assert.True(t, hasSSHRule, "Bastion security group should have SSH rule")
}
