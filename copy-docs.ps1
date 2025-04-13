# Create the docs directory in the frontend/public folder if it doesn't exist
$docsDir = "frontend/public/docs"
if (-not (Test-Path $docsDir)) {
    New-Item -ItemType Directory -Path $docsDir -Force
}

# Copy all markdown files from the docs directory to the frontend/public/docs directory
Copy-Item -Path "docs/*.md" -Destination $docsDir -Force

Write-Host "Documentation files copied successfully to $docsDir"
