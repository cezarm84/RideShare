# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) workflows set up for this project.

## Workflow Overview

### Branch Strategy

We follow a GitFlow-inspired branching strategy:

- `main`: Production-ready code
- `develop`: Integration branch for features
- Feature branches: Created from `develop` for new features
- Hotfix branches: Created from `main` for urgent fixes

### CI/CD Pipelines

#### Frontend CI/CD

The frontend CI/CD pipeline is triggered on:

- Pushes to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Manual triggers

Pipeline steps:

1. Build and test
   - Install dependencies
   - Lint code
   - Build the application
   - Run tests with coverage
2. Deploy to staging (for `develop` branch)
3. Deploy to production (for `main` branch)

#### Backend CI/CD

The backend CI/CD pipeline is triggered on:

- Pushes to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Manual triggers

Pipeline steps:

1. Test
   - Set up Python and dependencies
   - Run database migrations
   - Run tests with coverage
2. Build and push Docker image
3. Deploy to staging (for `develop` branch)
4. Deploy to production (for `main` branch)

### Pull Request Validation

All pull requests are validated for:

- Conventional commit message format
- Semantic PR title
- No large files

## Development Workflow

### Starting a New Feature

1. Create a new branch from `develop`:

   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit using conventional commit format:

   ```bash
   git commit -m "feat(component): add new feature"
   ```

3. Push your branch and create a pull request to `develop`:
   ```bash
   git push -u origin feature/your-feature-name
   ```

### Hotfix Workflow

1. Create a hotfix branch from `main`:

   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/issue-description
   ```

2. Fix the issue and commit:

   ```bash
   git commit -m "fix(component): fix critical issue"
   ```

3. Push your branch and create a pull request to `main`:

   ```bash
   git push -u origin hotfix/issue-description
   ```

4. After merging to `main`, cherry-pick the changes to `develop`:
   ```bash
   git checkout develop
   git cherry-pick <commit-hash>
   git push
   ```

### Creating a Release

1. Create a release branch from `develop`:

   ```bash
   git checkout develop
   git pull
   git checkout -b release/v1.0.0
   ```

2. Make any final adjustments and version bumps.

3. Create a pull request to `main`.

4. After merging to `main`, tag the release:
   ```bash
   git checkout main
   git pull
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push --tags
   ```

## Environment Variables and Secrets

### GitHub Secrets

The following secrets need to be set up in your GitHub repository settings:

- `DOCKER_HUB_USERNAME`: Your Docker Hub username
- `DOCKER_HUB_TOKEN`: Your Docker Hub access token (not your password)
- `CODECOV_TOKEN`: Your Codecov token for uploading coverage reports

### Frontend Environment Variables

- `VITE_API_URL`: Backend API URL
- `VITE_ENVIRONMENT`: Environment name (development, staging, production)

### Backend Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `ENVIRONMENT`: Environment name (development, staging, production)

## Deployment Environments

### Staging

- URL: https://staging.yourapp.com
- Automatically deployed from the `develop` branch
- Used for testing and QA

### Production

- URL: https://yourapp.com
- Automatically deployed from the `main` branch
- Used for end users
