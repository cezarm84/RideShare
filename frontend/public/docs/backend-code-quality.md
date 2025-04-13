# Backend Code Quality Tools

## Tools

1. **Black**: Code formatter that enforces a consistent style
2. **isort**: Sorts imports alphabetically and by type
3. **Ruff**: Fast Python linter that combines multiple tools
4. **mypy**: Static type checker for Python
5. **bandit**: Security-focused static analyzer
6. **pytest-cov**: Measures test coverage

## Configuration Files

### pyproject.toml

```toml
[tool.black]
line-length = 88
target-version = ['py39']
include = '\.pyi?$'

[tool.isort]
profile = "black"
line_length = 88
multi_line_output = 3

[tool.ruff]
line-length = 88
target-version = "py39"
select = [
    "E",   # pycodestyle errors
    "F",   # pyflakes
    "B",   # flake8-bugbear
    "I",   # isort
    "C4",  # flake8-comprehensions
    "SIM", # flake8-simplify
    "TCH", # flake8-type-checking
    "TID", # flake8-tidy-imports
    "UP",  # pyupgrade
]
ignore = [
    "E501",  # line too long (handled by black)
]

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
strict_optional = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
python_classes = "Test*"
addopts = "--cov=app --cov-report=term-missing --cov-report=xml"
```

## CI Integration

Add these checks to your CI pipeline:

```yaml
- name: Run code quality checks
  run: |
    black --check .
    isort --check .
    ruff check .
    mypy .
    bandit -r app/

- name: Run tests with coverage
  run: |
    pytest --cov=app --cov-report=xml
```

## Editor Integration

### VS Code settings.json

```json
{
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.mypyEnabled": true,
  "python.linting.banditEnabled": true,
  "python.linting.flake8Enabled": false,
  "python.linting.ruffEnabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## Best Practices

1. **Run tools locally** before committing
2. **Fix issues incrementally** rather than all at once
3. **Document exceptions** when ignoring specific rules
4. **Keep configuration in version control** for consistency
5. **Update tools regularly** to benefit from improvements
