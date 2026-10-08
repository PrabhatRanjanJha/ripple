# Ripple

Ripple is a project planner. You add tasks with durations and dependencies, and Ripple works out the schedule and the critical path, the chain of tasks that decides your finish date. A what-if simulator shows what happens to the finish date if a task slips, without touching your real plan.

## Tech stack

- MongoDB, Express, React, Node.js (MERN)
- Mongoose, JWT authentication with HttpOnly cookies, bcrypt
- Tailwind CSS

## Local development setup

1. Duplicate the environment files in both apps and adjust the values for your local machine:
   - `server/.env.example` -> `server/.env`
   - `client/.env.example` -> `client/.env`
2. Start MongoDB locally and make sure the database URLs in `server/.env` point to a working database.
3. In `server/`, install dependencies and start the API:
   - `npm install`
   - `npm run dev`
4. In `client/`, install dependencies and start Vite:
   - `npm install`
   - `npm run dev`
5. Keep the frontend on `http://localhost:5173` and the backend on `http://localhost:5000` so the cookie and CORS settings line up with `CLIENT_URL` and `VITE_API_URL`.

## Authentication and CORS

- The backend sets the JWT in an HttpOnly cookie named `token`.
- Cookies are configured with `sameSite: "lax"` in development and `sameSite: "none"` with `secure: true` in production.
- The server allows credentials only for the configured `CLIENT_URL` origin, so requests from the frontend keep their session while the browser remains on the Vite dev server.

## Useful commands

- `cd server && npm run smoke`
- `cd server && node --test`
- `cd client && npm run build`
