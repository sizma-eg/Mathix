# Mathix

Mathix is an AI study assistant for Mathematics, Physics and Chemistry.

## Included
- Register / Login with JWT
- bcrypt password hashing
- SQLite database
- Server-side History and Favorites
- One daily usage limit (no Free/Pro plan system)
- User Dashboard
- Arabic / English interface
- Text problem solving
- Image upload solving
- Camera scan → image capture → AI solving
- Automatic image compression before upload
- Responsive mobile interface
- Developed by Sizma footer link

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env`
3. Add `OPENAI_API_KEY`
4. Set a strong `JWT_SECRET`
5. `npm start`
6. Open `http://localhost:3000`

The camera requires browser permission and normally works on HTTPS or `localhost`.

Default daily solving limit: 5 solves/day. Change `DAILY_LIMIT` in `.env` if needed.

Footer: Developed by Sizma — https://sizma-eg.github.io/us
