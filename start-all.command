osascript -e 'tell application "Terminal" to do script "cd ~/Sites/queue/api && npm start"'
osascript -e 'tell application "Terminal" to do script "cd ~/Sites/queue/server && npm run dev"'
cd ~/Sites/queue/client && npm run dev