#!/bin/bash
# Driftloop — double-click to play. Close this window (or Ctrl+C) to stop.
cd "$(dirname "$0")"
PORT=8787
( sleep 1; open "http://localhost:$PORT" ) &
echo ""
echo "   ~ Driftloop is playing ~"
echo "   http://localhost:$PORT"
echo ""
echo "   Leave this window open while you listen."
echo "   Close it (or press Ctrl+C) to stop."
echo ""
python3 -m http.server $PORT --directory public >/dev/null 2>&1
