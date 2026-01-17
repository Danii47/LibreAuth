#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "❌ Error: You must provide the version number."
  echo "Usage: ./release.sh <version>"
  echo "Example: ./release.sh 1.0.3"
  exit 1
fi

NEW_VERSION=$1

print_step() {
  echo ""
  echo "🚀 $1"
  echo "----------------------------------------------------"
}

print_step "Checking repository status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: You have uncommitted changes. Please commit or stash them before releasing."
  exit 1
fi

echo "⚠️ ¿Has actualizado las notas de la versión en 'distribution/whatsnew/'?"
echo "   (Si no lo has hecho, cancela con Ctrl+C, actualízalas y haz commit)"
read -p "Presiona ENTER para continuar si ya están listas..."

print_step "Updating 'dev' branch..."
git checkout dev
git pull origin dev

print_step "Synchronizing 'main' and merging changes..."
git checkout main
git pull origin main
git merge dev --no-ff --no-edit


print_step "Updating version to $NEW_VERSION..."

npm version $NEW_VERSION --no-git-tag-version

node -e "
const fs = require('fs');
const fileName = './app.json';
const file = require(fileName);


file.expo.version = '$NEW_VERSION';

fs.writeFileSync(fileName, JSON.stringify(file, null, 2));
console.log('✅ app.json updated.');
"

print_step "Creating version commit and pushing to main..."
git add app.json package.json package-lock.json
git commit -m "chore: bump version to $NEW_VERSION"
git push origin main

print_step "Creating tag v$NEW_VERSION and triggering CI/CD..."
git tag "v$NEW_VERSION"
git push origin "v$NEW_VERSION"

print_step "Returning to development branch..."
git checkout dev

print_step "Merging main into dev..."
git merge main
git push origin dev

echo ""
echo "🎉 Release v$NEW_VERSION completed successfully!"
echo "The GitHub Actions workflow should start shortly."