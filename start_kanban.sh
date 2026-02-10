#!/bin/bash

# Run npm install in both server and client directories
echo "Installing server dependencies..."
npm install
echo "Installing client dependencies..."
cd client && npm install
cd ..

# Cleanup function to kill all background processes
cleanup() {
    echo "Stopping all processes..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap EXIT and SIGINT (Ctrl+C) to run cleanup
trap cleanup EXIT INT

# Start the server in the background
node server.js &

# Start the client
cd client && npm start