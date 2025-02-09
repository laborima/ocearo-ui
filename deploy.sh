#!/bin/bash

# Configuration variables
LOCAL_BUILD_DIR="./out"  # Path to the Next.js build directory
REMOTE_USER="pi"           # Username for the Raspberry Pi
REMOTE_HOST="cirrus.local" # IP or hostname of the Raspberry Pi
REMOTE_PLUGIN_DIR="/home/pi/.signalk/node_modules/ocearo-ui" # Path to the plugin folder on the Pi
SSH_PORT=22                # SSH port, default is 22

# Build the Next.js project
echo "Building the Next.js project..."
NODE_ENV=production npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Build failed! Aborting deployment."
  exit 1
fi

# Transfer files using SCP
echo "Transferring files to Raspberry Pi..."
scp -r -P $SSH_PORT $LOCAL_BUILD_DIR/* $REMOTE_USER@$REMOTE_HOST:$REMOTE_PLUGIN_DIR
#scp -r -P $SSH_PORT ./package.json $REMOTE_USER@$REMOTE_HOST:$REMOTE_PLUGIN_DIR

# Check if SCP was successful
if [ $? -ne 0 ]; then
  echo "File transfer failed! Please check your connection and configuration."
  exit 1
fi

# Optional: Restart Signal K server
echo "Restarting Signal K server on Raspberry Pi..."
ssh -p $SSH_PORT $REMOTE_USER@$REMOTE_HOST "sudo systemctl restart signalk"

if [ $? -ne 0 ]; then
  echo "Failed to restart Signal K server! Please restart it manually."
  exit 1
fi

echo "Deployment complete!"
