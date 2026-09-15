# Mathix

Mathix is a responsive AI study-assistant frontend for Mathematics, Physics and Chemistry.

This version has **no Login, Register, Database, Pro/Free plans, or Dashboard account system**. History and Favorites are stored locally in the browser.

## Important
The UI can be hosted on GitHub Pages, but real AI solving through `/api/solve` requires a backend server. GitHub Pages cannot run `server.js`. Keep the backend on a Node-compatible host and point the frontend API URL to it before public launch.

Camera scans and uploaded images are converted to JPEG data URLs in the browser so they are ready to be sent to the AI backend.
