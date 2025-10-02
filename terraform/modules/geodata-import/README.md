# Geodata Import Module

This Terraform module creates ECS infrastructure for importing TIGER/Line shapefiles and other geographic data. The module is designed for occasional, CPU and memory-intensive GDAL operations that are not suitable for Lambda.

## Resources Created

- **ECS Cluster**: For running geodata import tasks
- **ECS Task Definition**: Configured for GDAL operations
- **IAM Roles**: For ECS execution and task permissions
- **CloudWatch Log Group**: For import process logs

## Usage

```hcl
module "geodata_import" {
  source = "./modules/geodata-import"

  prefix                = "coalition-builder"
  aws_region           = "us-east-1"
  ecr_repository_url   = "123456789.dkr.ecr.us-east-1.amazonaws.com/coalition-builder"
  database_secret_arn  = "arn:aws:secretsmanager:us-east-1:123456789:secret:db-url"
  django_secret_key_arn = "arn:aws:secretsmanager:us-east-1:123456789:secret:django-key"
  s3_bucket_arn        = "arn:aws:s3:::coalition-builder-assets"

  tags = {
    Environment = "production"
    Application = "coalition-builder"
  }
}
```

## Inputs

| Name                  | Description                                | Type        | Default | Required |
| --------------------- | ------------------------------------------ | ----------- | ------- | :------: |
| prefix                | Resource name prefix                       | string      | n/a     |   yes    |
| aws_region            | AWS region                                 | string      | n/a     |   yes    |
| ecr_repository_url    | ECR repository URL for the container image | string      | n/a     |   yes    |
| database_secret_arn   | ARN of the database connection secret      | string      | n/a     |   yes    |
| django_secret_key_arn | ARN of the Django secret key               | string      | n/a     |   yes    |
| s3_bucket_arn         | ARN of the S3 bucket for application data  | string      | n/a     |   yes    |
| tags                  | Tags to apply to all resources             | map(string) | {}      |    no    |

## Outputs

| Name                   | Description                        |
| ---------------------- | ---------------------------------- |
| cluster_name           | Name of the ECS cluster            |
| cluster_arn            | ARN of the ECS cluster             |
| task_definition_arn    | ARN of the task definition         |
| task_definition_family | Family name of the task definition |
| execution_role_arn     | ARN of the execution role          |
| task_role_arn          | ARN of the task role               |
| log_group_name         | Name of the CloudWatch log group   |

## Task Configuration

### Resource Allocation

- **CPU**: 2048 (2 vCPU) - Required for GDAL shapefile processing
- **Memory**: 4096 (4GB) - Required for loading large shapefiles
- **Network Mode**: awsvpc (required for Fargate)
- **Launch Type**: Fargate (serverless)

### Container Configuration

- **Image**: Uses the same ECR repository as the main application
- **Environment Variables**:
  - `USE_GEODJANGO=true`: Enables PostGIS features
  - `DJANGO_SETTINGS_MODULE=coalition.core.settings`
  - `IS_ECS_GEODATA_IMPORT=true`: Identifies import context

### Secrets

- **DATABASE_URL**: Fetched from AWS Secrets Manager
- **SECRET_KEY**: Django application secret from Secrets Manager

## Usage Patterns

### Via GitHub Actions

The geodata-import workflow triggers ECS tasks:

```yaml
# .github/workflows/geodata-import.yml
- name: Run ECS Task
  run: |
    aws ecs run-task \
      --cluster ${{ cluster_name }} \
      --task-definition ${{ task_definition_family }} \
      --launch-type FARGATE \
      --overrides '{
        "containerOverrides": [{
          "name": "geodata-import",
          "command": ["python", "manage.py", "import_tiger_data", "--all"]
        }]
      }'
```

### Manual Execution

```bash
aws ecs run-task \
  --cluster coalition-builder-geodata-import \
  --task-definition coalition-builder-geodata-import \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "geodata-import",
      "command": ["python", "manage.py", "import_tiger_data", "--type=state", "--states=CA,NY,TX"]
    }]
  }'
```

## Import Commands

The task definition supports various import operations:

### All TIGER Data

```bash
python manage.py import_tiger_data --all --year=2023
```

### Specific Data Types

```bash
# States only
python manage.py import_tiger_data --type=state --year=2023

# Counties for specific states
python manage.py import_tiger_data --type=county --states=CA,NY,TX

# Places (cities/towns)
python manage.py import_tiger_data --type=place --states=CA
```

## Performance Characteristics

### Import Times (Approximate)

- **All States**: 5-10 minutes
- **All Counties**: 15-25 minutes
- **All Places**: 20-30 minutes
- **Complete Import**: 45-60 minutes

### Cost per Import

- **Fargate Task**: ~$0.50 per hour
- **Data Transfer**: ~$0.10 per import
- **Total**: ~$0.60 per full import

### Frequency

- **Initial Setup**: One-time full import
- **Updates**: Annual or as needed
- **Targeted Updates**: State-specific as required

## Monitoring

### CloudWatch Logs

- **Log Group**: `/ecs/geodata-import`
- **Log Streams**: `geodata/{task-id}`
- **Retention**: 7 days (cost optimization)

### Monitoring Import Progress

```bash
# Follow logs
aws logs tail /ecs/geodata-import --follow

# Check task status
aws ecs describe-tasks --cluster coalition-builder-geodata-import --tasks {task-arn}
```

## Security Features

### IAM Permissions

- **Execution Role**: ECS task execution, Secrets Manager access
- **Task Role**: S3 access for Census data download
- **Principle of Least Privilege**: Scoped permissions

### Network Security

- **Public IP**: Required for downloading Census data
- **Security Groups**: Minimal egress rules
- **VPC**: Isolated network environment

## Troubleshooting

### Common Issues

1. **Out of Memory**

   ```
   Solution: Import specific states instead of all data
   Example: --states=CA,NY instead of --all
   ```

2. **Network Timeouts**

   ```
   Solution: Check security group egress rules
   Ensure ports 80/443 are open for Census FTP
   ```

3. **Database Connection Errors**

   ```
   Solution: Verify RDS security group allows ECS access
   Check Secrets Manager permissions
   ```

### Debugging Steps

1. **Check ECS Task Status**

   ```bash
   aws ecs describe-tasks --cluster {cluster} --tasks {task-arn}
   ```

2. **View Container Logs**

   ```bash
   aws logs get-log-events --log-group-name /ecs/geodata-import --log-stream-name geodata/{task-id}
   ```

3. **Verify Permissions**

   ```bash
   aws iam simulate-principal-policy --policy-source-arn {task-role-arn} --action-names s3:GetObject --resource-arns arn:aws:s3:::census-bucket/*
   ```

## Cost Optimization

- **On-Demand**: Only runs when triggered
- **Log Retention**: 7 days to minimize storage costs
- **Container Insights**: Disabled to reduce costs
- **Spot Instances**: Not supported with Fargate, but tasks complete quickly

This module provides a cost-effective way to handle heavy geospatial data processing while keeping the main application serverless.
