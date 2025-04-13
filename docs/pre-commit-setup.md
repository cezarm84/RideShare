# Pre-commit Hooks Setup

This project uses pre-commit hooks to ensure code quality and consistency.

## Installation

1. Install pre-commit:
```bash
pip install pre-commit
```

2. Install the git hooks:
```bash
pre-commit install
pre-commit install --hook-type commit-msg
```

3. (Optional) Run against all files:
```bash
pre-commit run --all-files
```

## What's Included

- **Code formatting**: Black for Python, ESLint for JavaScript/TypeScript
- **Import sorting**: isort for Python
- **Linting**: Ruff for Python, ESLint for JavaScript/TypeScript
- **General checks**: trailing whitespace, file endings, YAML validation, merge conflicts
- **Commit message validation**: Ensures commit messages follow the Conventional Commits format

## Bypassing Hooks

In rare cases when you need to bypass the hooks:

```bash
git commit -m "message" --no-verify
```

However, this should be used sparingly as it defeats the purpose of having the hooks.
