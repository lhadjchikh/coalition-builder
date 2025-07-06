# Terraform Testing Suite

This directory contains comprehensive unit and integration tests for the Coalition Builder Terraform infrastructure using [Terratest](https://terratest.gruntwork.io/).

## 📁 Test Structure

```
tests/
├── common/
│   └── test_helpers.go                # Shared test utilities and configuration
├── modules/
│   ├── networking_test.go             # Tests for networking module
│   ├── compute_test.go                # Tests for compute module
│   ├── security_test.go               # Tests for security module
│   ├── database_test.go               # Tests for database module
│   ├── monitoring_test.go             # Tests for monitoring module
│   ├── secrets_test.go                # Tests for secrets module
│   ├── storage_test.go                # Tests for storage module
│   ├── dns_test.go                    # Tests for dns module
│   └── loadbalancer_test.go           # Tests for loadbalancer module
├── integration/
│   └── main_configuration_test.go     # End-to-end terraform configuration tests
├── go.mod                             # Go module dependencies
├── Makefile                           # Test runner and utilities
└── README.md                          # This file
```

## 🧪 Test Types

### Unit Tests (`modules/`)

Fast validation tests that check module file structure and configuration:

- **File Structure Validation**: Ensures all modules have required files (main.tf, variables.tf, outputs.tf, versions.tf)
- **No AWS Resources**: Tests run with `-short` flag and validate structure only
- **No AWS Credentials Required**: Uses fake credentials to prevent provider initialization

### Integration Tests (`integration/`)

Plan-only validation tests using real AWS credentials:

- **Main Configuration Testing**: Tests the root terraform configuration with different scenarios
- **Variable Validation**: Tests with/without SSR, different CORS configurations, required variables
- **Resource Planning**: Validates terraform can plan successfully and includes expected resources
- **Output Validation**: Ensures all expected outputs are defined

## 🚀 Quick Start

### Prerequisites

1. **Go 1.24+** installed
2. **AWS CLI** configured with appropriate credentials (for integration tests only)
3. **Terraform** installed (version 1.12.1+)
4. **Make** (optional, for convenience commands)

### Setup

```bash
# Navigate to tests directory
cd terraform/tests

# Install dependencies
go mod download

# Verify setup
go version
terraform version
```

## 💻 Running Tests Locally

### Unit Tests (No AWS Required)

The fastest way to validate module structure:

```bash
# Run all unit tests (validates file structure only)
go test -short ./modules/

# Or with make
make test-unit
```

**What this does:**

- ✅ Validates all terraform modules have required files
- ✅ Compiles all test code
- ✅ Runs in ~10 seconds
- ✅ No AWS credentials required
- ✅ No AWS costs incurred

### Integration Tests (AWS Credentials Required)

Plan-only validation that tests terraform configuration:

```bash
# Run all integration tests (requires AWS credentials)
go test ./integration/

# Run specific integration test
go test -v -run TestMainConfigurationWithoutSSR ./integration/
go test -v -run TestMainConfigurationWithSSR ./integration/
go test -v -run TestMainConfigurationCORS ./integration/
```

**What this does:**

- ✅ Tests terraform init and plan with real AWS credentials
- ✅ Validates all expected resources and outputs are defined
- ✅ Tests different configuration scenarios (SSR on/off, CORS settings)
- ✅ Runs in ~2-3 minutes per test
- ✅ No AWS resources created = $0 cost

### All Tests

```bash
# Run everything (unit + integration)
go test ./...

# Or with make
make test-all
```

## 📋 Test Commands

### Using Make (Recommended)

```bash
# Show all available commands
make help

# Run unit tests only (no AWS required)
make test-unit

# Run integration tests only (AWS credentials required)
make test-integration

# Run all tests
make test-all

# Format and lint code
make fmt-check
make lint

# Clean up test artifacts
make clean
```

### Using Go Directly

```bash
# Run unit tests only (file structure validation)
go test -short ./modules/

# Run integration tests only (plan validation)
go test ./integration/

# Run all tests
go test ./...

# Run with verbose output
go test -v ./...

# Run specific test
go test -v -run TestMainConfigurationWithSSR ./integration/
```

## 🔧 Configuration

### Environment Variables for Integration Tests

```bash
# AWS Configuration (required for integration tests)
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile

# Verify AWS setup
aws sts get-caller-identity
```

### Test Configuration

Tests use unique prefixes to avoid conflicts:

```go
testConfig := common.NewTestConfig("../../")
// Creates prefix like "coalition-test-12345"
```

## 🧩 Test Coverage

### Unit Tests (Module Validation)

All modules have unit tests that validate:

- ✅ **Required Files**: main.tf, variables.tf, outputs.tf, versions.tf exist
- ✅ **File Structure**: Proper terraform module structure
- ✅ **Fast Execution**: Runs in seconds with no AWS dependencies

**Modules Covered:**

- `networking` - VPC and subnet configuration
- `compute` - ECS cluster and ECR repositories
- `security` - Security groups and WAF
- `database` - RDS PostgreSQL instance
- `monitoring` - SNS topics and budget monitoring
- `secrets` - Secrets Manager integration
- `storage` - S3 bucket configuration
- `dns` - Route53 DNS records
- `loadbalancer` - Application Load Balancer

### Integration Tests (Configuration Validation)

Comprehensive plan-only tests that validate:

**TestMainConfigurationWithoutSSR:**

- ✅ Complete infrastructure plan without SSR
- ✅ All expected outputs defined
- ✅ Key resources planned correctly
- ✅ SSR-specific resources excluded

**TestMainConfigurationWithSSR:**

- ✅ Complete infrastructure plan with SSR enabled
- ✅ Both API and SSR containers configured
- ✅ SSR-specific outputs included

**TestMainConfigurationValidation:**

- ✅ Missing required variables cause plan failure
- ✅ Complete configuration plans successfully

**TestMainConfigurationCORS:**

- ✅ Default CORS configuration (uses domain_name)
- ✅ Explicit CORS origins configuration

## 🔍 Key Testing Patterns

### Unit Test Pattern

```go
func TestDnsModuleValidation(t *testing.T) {
    common.ValidateModuleStructure(t, "dns")
}
```

### Integration Test Pattern

```go
func TestMainConfigurationWithoutSSR(t *testing.T) {
    testConfig := common.NewTestConfig("../../")
    testVars := common.GetIntegrationTestVars()
    testVars["enable_ssr"] = false

    terraformOptions := testConfig.GetTerraformOptions(testVars)

    terraform.Init(t, terraformOptions)
    planOutput := terraform.Plan(t, terraformOptions)

    assert.Contains(t, planOutput, "aws_vpc.main", "Plan should create VPC")
    assert.Contains(t, planOutput, "enable_ssr = false", "Plan should disable SSR")
}
```

## ⚠️ Important Notes

### No AWS Costs

- **Unit Tests**: No AWS interaction, completely free
- **Integration Tests**: Plan-only validation, no resources created, $0 cost
- **No Cleanup Required**: Since no resources are created, no cleanup needed

### AWS Permissions for Integration Tests

Integration tests require AWS credentials with read permissions for:

- EC2 (for VPC and networking validation)
- RDS (for database configuration validation)
- ECS (for container service validation)
- IAM (for role and policy validation)

**Note**: Tests only run `terraform plan`, so only read permissions are needed.

### Test Isolation

- Each test uses unique resource prefixes
- Tests are independent and can run in parallel
- No state files or temporary resources created

## 🚨 Troubleshooting

### Common Issues

#### AWS Credentials (Integration Tests Only)

```bash
# Verify credentials for integration tests
aws sts get-caller-identity

# Configure if needed
aws configure
```

#### Go Dependencies

```bash
# Update dependencies
go mod download
go mod tidy

# Verify installation
go version
```

#### Terraform Issues

```bash
# Verify terraform installation
terraform version

# Check PATH
which terraform
```

### Debug Mode

```bash
# Run with verbose output
go test -v ./...

# Run single test for debugging
go test -v -run TestMainConfigurationWithSSR ./integration/

# Debug terraform plan output
export TF_LOG=DEBUG
go test -v -run TestMainConfigurationWithSSR ./integration/
```

## 📈 CI/CD Integration

The tests integrate seamlessly with CI/CD pipelines:

### GitHub Actions Workflow

```yaml
name: Terraform Tests
on: [push, pull_request]
jobs:
  terraform-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v4
        with:
          go-version: "1.24"
      - name: Run unit tests
        run: |
          cd terraform/tests
          go test -short ./modules/
      - name: Run integration tests
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd terraform/tests
          go test ./integration/
```

### Benefits for CI/CD

- **Fast Execution**: All tests complete in ~3-5 minutes
- **Cost Effective**: No AWS resources created
- **Reliable**: No flaky cleanup or resource conflicts
- **Parallel Safe**: Tests can run simultaneously

## 🤝 Contributing

### Adding New Module Tests

1. Create `modules/newmodule_test.go`:

```go
func TestNewmoduleModuleValidation(t *testing.T) {
    common.ValidateModuleStructure(t, "newmodule")
}
```

2. The unit test will automatically validate the module has required files

### Adding Integration Test Scenarios

Add new test cases to `integration/main_configuration_test.go`:

```go
func TestMainConfigurationNewFeature(t *testing.T) {
    testConfig := common.NewTestConfig("../../")
    testVars := common.GetIntegrationTestVars()
    testVars["new_feature_enabled"] = true

    terraformOptions := testConfig.GetTerraformOptions(testVars)
    terraform.Init(t, terraformOptions)
    planOutput := terraform.Plan(t, terraformOptions)

    assert.Contains(t, planOutput, "new_feature_resource", "Should plan new feature")
}
```

### Test Guidelines

- ✅ Use descriptive test names
- ✅ Unit tests should use `common.ValidateModuleStructure`
- ✅ Integration tests should validate plan output
- ✅ Include both positive and negative test cases
- ✅ Follow Go testing conventions

## 📚 Resources

- [Terratest Documentation](https://terratest.gruntwork.io/)
- [Go Testing Package](https://golang.org/pkg/testing/)
- [Terraform Testing Best Practices](https://www.terraform.io/docs/extend/testing/)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
