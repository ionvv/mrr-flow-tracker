#!/bin/bash

PORT=8119
PID_FILE="/tmp/python_server.pid"

start() {
    if [ -f "$PID_FILE" ]; then
        echo "Server already running (PID: $(cat $PID_FILE))"
        exit 1
    fi
    
    echo "Starting Python server on port $PORT..."
    python3 -m http.server $PORT &
    echo $! > "$PID_FILE"
    echo "Server started (PID: $(cat $PID_FILE))"
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Server not running"
        exit 1
    fi
    
    PID=$(cat "$PID_FILE")
    echo "Stopping server (PID: $PID)..."
    kill $PID
    rm "$PID_FILE"
    echo "Server stopped"
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        start
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac