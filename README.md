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


## API

All routes except `/health`, `/users/register` and `/users/login` need the login cookie. Every response is JSON shaped `{ success, message, ... }`.

| Method | Route | What it does |
|---|---|---|
| GET | `/health` | Server check |
| POST | `/users/register` | Create an account |
| POST | `/users/login` | Log in and set the HttpOnly cookie |
| GET | `/users/me` | Get the logged in user |
| POST | `/users/logout` | Log out and clear the cookie |
| POST | `/projects` | Create a project |
| GET | `/projects` | List your projects |
| GET | `/projects/:id` | Get one project |
| PATCH | `/projects/:id` | Update a project |
| DELETE | `/projects/:id` | Delete a project with its tasks and scenarios |
| POST | `/projects/:projectId/tasks` | Add a task, with optional dependencies |
| GET | `/projects/:projectId/tasks` | List the tasks of a project |
| PATCH | `/tasks/:id` | Update a task, rejects circular dependencies |
| DELETE | `/tasks/:id` | Delete a task and remove it from other tasks' dependencies |
| GET | `/projects/:id/schedule` | Schedule, critical path, deadline status and progress |
| POST | `/projects/:id/simulate` | What-if run, nothing is saved |
| POST | `/projects/:id/scenarios` | Save a what-if as a scenario |
| GET | `/projects/:id/scenarios` | List saved scenarios |
| GET | `/scenarios/:id/run` | Run a saved scenario |
| DELETE | `/scenarios/:id` | Delete a scenario |


## Deployment

The server runs on Render, the client on Vercel, and the data lives in MongoDB Atlas.

1. **Atlas:** create a database user, and under Network Access allow `0.0.0.0/0` so the hosted server can connect. Copy the connection string and add a database name such as `ripple_live` before the `?`.
2. **Render (server):** create a Web Service from this repository with these settings.
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/health`
   - Environment variables: `MONGO_URI`, `JWT_SECRET` (a new long random string), `NODE_ENV=production`, `NODE_VERSION=22`, and `CLIENT_URL` (the Vercel address, added in step 4).
3. **Vercel (client):** import this repository with root directory `client` and framework Vite. Add the variable `VITE_API_URL` set to the Render address, with no trailing slash, and deploy.
4. **Connect them:** set `CLIENT_URL` on Render to the final Vercel address and redeploy the server.

The login cookie is `HttpOnly`, and in production it is `Secure` with `SameSite=None`, so the client and server can sit on different domains. Browsers that block third-party cookies may stop the login from working on the live site.