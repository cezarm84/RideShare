# Deployment Strategy

## Environment Structure

1. **Development**: Local development environment
2. **Testing**: Automated tests run here
3. **Staging**: Pre-production environment for QA and testing
4. **Production**: Live environment for end users

## Infrastructure (AWS Example)

### Backend Infrastructure

- **API**: AWS ECS Fargate (containerized)
- **Database**: AWS RDS PostgreSQL
- **Cache**: AWS ElastiCache Redis
- **Storage**: AWS S3
- **CDN**: AWS CloudFront
- **DNS**: AWS Route 53

### Frontend Infrastructure

- **Hosting**: AWS S3 + CloudFront
- **CDN**: AWS CloudFront
- **DNS**: AWS Route 53

## Deployment Pipeline

### Backend Deployment

```yaml
name: Backend Deployment

on:
  push:
    branches:
      - develop
      - main
    paths:
      - 'app/**'
      - 'requirements.txt'
      - 'Dockerfile'
      - '.github/workflows/backend-deployment.yml'

jobs:
  test:
    # Test job (as in current workflow)

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: success()
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-north-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: rideshare-api
          IMAGE_TAG: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}-${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: .aws/task-definition-${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}.json
          container-name: rideshare-api
          image: ${{ steps.login-ecr.outputs.registry }}/rideshare-api:${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}-${{ github.sha }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: rideshare-api-${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
          cluster: rideshare-${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
          wait-for-service-stability: true

  run-migrations:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: success()
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run migrations
        env:
          DATABASE_URL: ${{ github.ref == 'refs/heads/main' && secrets.PROD_DATABASE_URL || secrets.STAGING_DATABASE_URL }}
          SECRET_KEY: ${{ github.ref == 'refs/heads/main' && secrets.PROD_SECRET_KEY || secrets.STAGING_SECRET_KEY }}
          ENVIRONMENT: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
        run: |
          python -m alembic upgrade head
```

### Frontend Deployment

```yaml
name: Frontend Deployment

on:
  push:
    branches:
      - develop
      - main
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-deployment.yml'

jobs:
  build-and-test:
    # Build and test job (as in current workflow)

  deploy-staging:
    needs: build-and-test
    if: github.ref == 'refs/heads/develop' && success()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-north-1

      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://rideshare-staging-frontend/ --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.STAGING_CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"

  deploy-production:
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && success()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-north-1

      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://rideshare-production-frontend/ --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.PRODUCTION_CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

## Infrastructure as Code

Use Terraform to manage your infrastructure:

```hcl
# Example Terraform configuration for S3 and CloudFront
resource "aws_s3_bucket" "frontend" {
  bucket = "rideshare-${var.environment}-frontend"
  acl    = "private"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

## Rollback Strategy

1. **Automated Rollbacks**: If deployment fails, automatically roll back to the previous version
2. **Manual Rollbacks**: Ability to manually trigger a rollback to a specific version
3. **Database Migrations**: Always have a rollback plan for database migrations

## Monitoring and Alerting

1. **Application Monitoring**: AWS CloudWatch or New Relic
2. **Error Tracking**: Sentry
3. **Performance Monitoring**: AWS X-Ray
4. **Alerting**: Set up alerts for critical errors and performance issues

## Security Considerations

1. **Secrets Management**: Use AWS Secrets Manager or GitHub Secrets
2. **IAM Roles**: Use least privilege principle
3. **Network Security**: Use VPC, security groups, and WAF
4. **HTTPS**: Enforce HTTPS everywhere
5. **Regular Security Audits**: Scan for vulnerabilities regularly
