#!/bin/bash

# Clean old build files
echo "Starting build..."
echo -n "Cleaning old builds... "
rm -r -f "build"
echo "Done!"

# Create directories
echo -n "Creating directories... "
mkdir "build"
mkdir "build/firefox"
mkdir "build/chromium"
echo "Done!"

# Add warnings
touch "build/DO NOT EDIT THESE FILES DIRECTLY"
touch "build/EDIT THE FILES IN THE SRC DIRECTORY AND RUN BUILD AGAIN"

# Build Firefox
echo -n "Creating Firefox files... "
cp -r "src/." "build/firefox/"
rm -f "build/firefox/manifest-chromium.json"
rm -f "build/firefox/content.js"
mv "build/firefox/manifest-firefox.json" "build/firefox/manifest.json"
echo "Done!"

# Build Chromium
echo -n "Creating Chromium files... "
cp -r "src/." "build/chromium/"
rm -f "build/chromium/manifest-firefox.json"
mv "build/chromium/manifest-chromium.json" "build/chromium/manifest.json"
echo "Done!"
echo "Build complete!"
