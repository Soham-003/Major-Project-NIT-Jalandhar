#!/bin/bash

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo ""
echo "================================================================================"
echo "EEG Driver Fatigue Detection & Monitoring System"
echo "================================================================================"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "Error: Python is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

echo "[1/4] Installing backend dependencies..."
cd "$SCRIPT_DIR/webapp/backend"
./venv/Scripts/pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Backend dependencies installation failed"
    exit 1
fi

echo ""
echo "[2/4] Installing frontend dependencies..."
cd "$SCRIPT_DIR/webapp/frontend"
npm install
if [ $? -ne 0 ]; then
    echo "Error: Frontend dependencies installation failed"
    exit 1
fi

echo ""
echo "[3/4] Starting Flask backend server..."
echo ""
cd "$SCRIPT_DIR/webapp/backend"
./venv/Scripts/python app.py &
BACKEND_PID=$!
sleep 3

echo ""
echo "[4/4] Starting React frontend development server..."
echo ""
cd "$SCRIPT_DIR/webapp/frontend"
npm start &
FRONTEND_PID=$!

echo ""
echo "================================================================================"
echo "System startup complete!"
echo ""
echo "Backend: http://127.0.0.1:5050"
echo "Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the servers"
echo "================================================================================"

wait
