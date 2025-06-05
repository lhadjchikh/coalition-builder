# Terraform Testing Suite

This directory contains comprehensive unit and integration tests for the Land and Bay Stewards Terraform infrastructure using [Terratest](https://terratest.gruntwork.io/).

## 📁 Test Structure

```
tests/
├── common/
│   └── test_helpers.go          # Shared test utilities and configuration
├── modules/
│   ├── networking_test.go       # Tests for networking module
│   ├── compute_test.go          # Tests for compute module
│   ├── security_test.go         # Tests for security module
│   └── database_test.go         # Tests for database module
├── integration/
│   └── full_stack_test.go       # End-to-end infrastructure tests
├── go.mod                       # Go module dependencies
├── Makefile                     # Test runner and utilities
└── README.md                    # This file
```

## 🧪 Test Types

### Unit Tests (`modules/`)

Test individual Terraform modules in isolation:

- **Networking Tests**: VPC, subnets, routing, VPC endpoints
- **Compute Tests**: ECS cluster, task definitions, ECR repositories, bastion host
- **Security Tests**: Security groups, WAF, IAM roles and policies
- **Database Tests**: RDS instance, subnet groups, parameter groups, encryption

### Integration Tests (`integration/`)

Test complete infrastructure deployments:

- **Full Stack Deployment**: Complete infrastructure with all modules
- **SSR Configuration**: Tests with Server-Side Rendering enabled/disabled
- **Security Configuration**: Validates security group rules and restrictions
- **Resource Tagging**: Ensures proper resource tagging
- **Budget Monitoring**: Tests cost monitoring setup

## 🚀 Quick Start

### Prerequisites

1. **Go 1.21+** installed
2. **AWS CLI** configured with appropriate credentials
3. **Terraform** installed
4. **Make** (optional, for convenience commands)

### Setup

```bash
# Navigate to tests directory
cd terraform/tests

# Install dependencies
go mod download

# Verify AWS configuration
aws sts get-caller-identity
```

### Running Tests

#### Unit Tests (Fast, No AWS Resources)

```bash
# Run all unit tests in short mode (no AWS resources created)
make test-all-short

# Or manually:
go test -short ./...
```

#### Unit Tests (With AWS Resources)

```bash
# Run all module tests
make test-unit

# Run specific module tests
make test-networking
make test-compute
make test-security
make test-database
```

#### Integration Tests

```bash
# Run integration tests (creates full infrastructure)
make test-integration

# Run specific integration test
go test -v -run TestFullStackDeploymentWithoutSSR ./integration/
```

## 📋 Test Commands

### Using Make (Recommended)

```bash
# Show all available commands
make help

# Setup development environment
make dev-setup

# Run pre-commit checks
make pre-commit

# Run all tests
make test-all

# Run tests without creating AWS resources
make test-all-short

# Clean up test artifacts
make clean
```

### Using Go Directly

```bash
# Run all tests in short mode
go test -short ./...

# Run all tests with AWS resources (longer)
go test ./...

# Run specific test
go test -v -run TestNetworkingModuleCreatesVPC ./modules/

# Run tests with custom timeout
go test -timeout 30m ./...
```

## 🔧 Configuration

### Environment Variables

```bash
# AWS Configuration
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile

# Test Configuration
export TEST_TIMEOUT=30m
```

### Test Configuration

Tests use unique prefixes to avoid conflicts:

```go
testConfig := common.NewTestConfig("../modules/networking")
// Creates prefix like "landandbay-test-12345"
```

## 🧩 Test Modules

### Networking Module Tests

- ✅ VPC creation with correct CIDR blocks
- ✅ Public subnet creation in multiple AZs
- ✅ Private subnet creation for applications
- ✅ Database subnet creation with isolation
- ✅ Internet Gateway attachment
- ✅ Route table configuration
- ✅ VPC endpoints for AWS services
- ✅ Resource naming conventions
- ✅ Resource tagging

### Compute Module Tests

- ✅ ECR repository creation for API and SSR
- ✅ ECS cluster creation
- ✅ IAM roles and policies for ECS tasks
- ✅ Task definition with/without SSR
- ✅ Bastion host deployment
- ✅ Resource constraints validation
- ✅ Security group assignments

### Security Module Tests

- ✅ ALB security group with HTTP/HTTPS rules
- ✅ Application security group with restricted access
- ✅ Database security group with PostgreSQL access
- ✅ Bastion security group with SSH restrictions
- ✅ WAF web ACL creation
- ✅ Security group rule references
- ✅ Egress rule restrictions

### Database Module Tests

- ✅ RDS PostgreSQL instance creation
- ✅ DB subnet group configuration
- ✅ Parameter group for PostgreSQL 16
- ✅ Secrets Manager integration
- ✅ Backup configuration
- ✅ Storage encryption
- ✅ PostGIS extension support
- ✅ Resource naming and tagging

### Integration Tests

- ✅ Full stack deployment without SSR
- ✅ Full stack deployment with SSR
- ✅ Deployment with existing VPC
- ✅ Security configuration validation
- ✅ Resource tagging across modules
- ✅ Budget monitoring setup

## 🔍 Test Patterns

### Resource Validation

```go
// Validate AWS resource exists and has correct properties
vpc := aws.GetVpcById(t, vpcID, testConfig.AWSRegion)
assert.Equal(t, "10.0.0.0/16", vpc.CidrBlock)
assert.Equal(t, "available", vpc.State)
```

### Resource Naming

```go
// Validate naming conventions
common.ValidateResourceNaming(t, resourceName, testConfig.Prefix, "expected-suffix")
```

### Resource Tagging

```go
// Validate required tags
expectedTags := map[string]string{
    "Name": fmt.Sprintf("%s-vpc", testConfig.Prefix),
    "Environment": "test",
}
common.ValidateResourceTags(t, vpc.Tags, expectedTags)
```

### Cleanup

```go
// Automatic cleanup with defer
defer common.CleanupResources(t, terraformOptions)
```

## ⚠️ Important Notes

### Cost Management

- **Short Mode**: Use `-short` flag to skip AWS resource creation
- **Timeouts**: Tests have 30-minute default timeout
- **Cleanup**: Resources are automatically destroyed after tests
- **Parallel**: Avoid running multiple integration tests simultaneously

### AWS Permissions

Tests require AWS permissions to create:
- VPC and networking resources
- ECS clusters and services
- RDS databases
- Security groups
- IAM roles and policies
- ECR repositories
- Load balancers

### Test Isolation

- Each test uses unique resource prefixes
- Tests clean up automatically with `defer`
- Use different AWS regions for parallel test runs

## 🚨 Troubleshooting

### Common Issues

#### AWS Credentials

```bash
# Verify credentials
aws sts get-caller-identity

# Configure if needed
aws configure
```

#### Test Timeouts

```bash
# Increase timeout for slow tests
go test -timeout 45m ./...
```

#### Resource Conflicts

```bash
# Clean up any leftover resources
make clean

# Check for existing resources with test prefix
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=landandbay-test-*"
```

#### Permission Errors

Ensure your AWS user/role has sufficient permissions:
- EC2 full access
- RDS full access
- ECS full access
- IAM role creation
- ECR repository management

### Debug Mode

```bash
# Run with verbose output
go test -v ./...

# Run single test for debugging
go test -v -run TestSpecificTest ./modules/
```

## 📈 CI/CD Integration

### GitHub Actions

```yaml
name: Terraform Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - name: Run short tests
        run: |
          cd terraform/tests
          make ci-test
```

### Local Development

```bash
# Setup git hooks for testing
echo "make pre-commit" > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 🤝 Contributing

### Adding New Tests

1. **Module Tests**: Add to appropriate `modules/*_test.go` file
2. **Integration Tests**: Add to `integration/full_stack_test.go`
3. **Helpers**: Update `common/test_helpers.go` for shared functionality

### Test Guidelines

- ✅ Use descriptive test names
- ✅ Include cleanup with `defer`
- ✅ Validate both success and failure cases
- ✅ Use `common.SkipIfShortTest(t)` for AWS resource tests
- ✅ Follow Go testing conventions
- ✅ Add documentation for complex test scenarios

### Example Test Structure

```go
func TestNewFeature(t *testing.T) {
    common.SkipIfShortTest(t)
    
    testConfig := common.NewTestConfig("../modules/mymodule")
    testVars := map[string]interface{}{
        "feature_enabled": true,
    }
    
    terraformOptions := testConfig.GetModuleTerraformOptions("../modules/mymodule", testVars)
    defer common.CleanupResources(t, terraformOptions)
    
    terraform.InitAndApply(t, terraformOptions)
    
    // Validate outputs
    output := terraform.Output(t, terraformOptions, "feature_output")
    assert.NotEmpty(t, output)
}
```

## 📚 Resources

- [Terratest Documentation](https://terratest.gruntwork.io/)
- [Go Testing Package](https://golang.org/pkg/testing/)
- [AWS Go SDK](https://docs.aws.amazon.com/sdk-for-go/)
- [Terraform Testing Best Practices](https://www.terraform.io/docs/extend/testing/index.html)