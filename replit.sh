#!/bin/bash
cd polymarket-bot
python bot.py &
uvicorn server:app --host 0.0.0.0 --port 8000 &
cd dashboard && npm install && npm run dev -- --host --port 3000
