#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if version is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No version number provided.${NC}"
    echo "Usage: $0 <version>"
    echo "Example: $0 0.1.2"
    exit 1
fi

NEW_VERSION="$1"

# Validate version format (e.g., 1.2.3 or 1.2.3-rc.1, etc.)
if [[ ! "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    echo -e "${RED}Error: Invalid version format '${NEW_VERSION}'.${NC}"
    echo "Version must be in semantic versioning format (e.g., 0.1.2, 1.0.0-rc.1)."
    exit 1
fi

echo "Updating application version to ${NEW_VERSION}..."

# Define paths relative to the script's directory (root of repository)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

PACKAGE_JSON="${ROOT_DIR}/package.json"
TAURI_CONF="${ROOT_DIR}/src-tauri/tauri.conf.json"
CARGO_TOML="${ROOT_DIR}/src-tauri/Cargo.toml"

# Update package.json
if [ -f "$PACKAGE_JSON" ]; then
    echo "Updating ${PACKAGE_JSON}..."
    if sed --version >/dev/null 2>&1; then
        # GNU sed
        sed -i -E 's/("version": ")[^"]+(")/\1'"$NEW_VERSION"'\2/' "$PACKAGE_JSON"
    else
        # macOS/BSD sed
        sed -i '' -E 's/("version": ")[^"]+(")/\1'"$NEW_VERSION"'\2/' "$PACKAGE_JSON"
    fi
else
    echo -e "${RED}Warning: ${PACKAGE_JSON} not found.${NC}"
fi

# Update src-tauri/tauri.conf.json
if [ -f "$TAURI_CONF" ]; then
    echo "Updating ${TAURI_CONF}..."
    if sed --version >/dev/null 2>&1; then
        # GNU sed
        sed -i -E 's/("version": ")[^"]+(")/\1'"$NEW_VERSION"'\2/' "$TAURI_CONF"
    else
        # macOS/BSD sed
        sed -i '' -E 's/("version": ")[^"]+(")/\1'"$NEW_VERSION"'\2/' "$TAURI_CONF"
    fi
else
    echo -e "${RED}Warning: ${TAURI_CONF} not found.${NC}"
fi

# Update src-tauri/Cargo.toml
if [ -f "$CARGO_TOML" ]; then
    echo "Updating ${CARGO_TOML}..."
    if sed --version >/dev/null 2>&1; then
        # GNU sed
        sed -i -E 's/^version = "[^"]+"/version = "'"$NEW_VERSION"'"/' "$CARGO_TOML"
    else
        # macOS/BSD sed
        sed -i '' -E 's/^version = "[^"]+"/version = "'"$NEW_VERSION"'"/' "$CARGO_TOML"
    fi
else
    echo -e "${RED}Warning: ${CARGO_TOML} not found.${NC}"
fi

echo -e "${GREEN}Version updated successfully to ${NEW_VERSION} in all target files!${NC}"
