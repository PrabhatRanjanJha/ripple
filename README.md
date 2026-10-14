# Ripple

Ripple is a full-stack project planner and what-if simulator. You add tasks with durations and dependencies, and Ripple automatically computes the project schedule and the critical path—the vital chain of tasks that determines your final finish date. A built-in what-if simulator lets you test task slips and duration changes to see their impact instantly, without modifying your live plan.

## Tech Stack

* **MongoDB, Express, React, Node.js (MERN)**
* **Mongoose**, **JWT Authentication** with `HttpOnly` cookies, **bcrypt**
* **Tailwind CSS**

---

## Local Development Setup

1. Duplicate the environment configuration files in both apps and adjust the values for your local machine:
   * `server/.env.example` $\rightarrow$ `server/.env`
   * `client/.env.example` $\rightarrow$ `client/.env`
2. Start MongoDB locally and ensure the database URLs in `server/.env` point to a working database instance.
3. In `server/`, install dependencies and start the API:
   * `npm install`
   * `npm run dev`
4. In `client/`, install dependencies and start Vite:
   * `npm install`
   * `npm run dev`
5. Keep the frontend running on `http://localhost:5173` and the backend on `http://localhost:5000` so that cookie and CORS settings line up seamlessly with `CLIENT_URL` and `VITE_API_URL`.

---

## Authentication and CORS

* The backend sets the authentication token inside an `HttpOnly` cookie named `token`.
* Cookies are configured with `sameSite: "lax"` in development and `sameSite: "none"` with `secure: true` in production.
* The server allows credentials only for the configured `CLIENT_URL` origin, ensuring requests from the frontend maintain their session securely.

---

## Useful Commands

* `cd server && npm run smoke`
* `cd server && node --test`
* `cd client && npm run build`

---

## API Reference

All routes except `/health`, `/users/register`, and `/users/login` require authentication via the login cookie. Every response is returned as JSON shaped `{ success, message, ... }`.

| Method | Route | Description |
| :--- | :--- | :--- |
| **GET** | `/health` | Server health check |
| **POST** | `/users/register` | Create a new user account |
| **POST** | `/users/login` | Log in and set the `HttpOnly` cookie |
| **GET** | `/users/me` | Get currently logged-in user profile |
| **POST** | `/users/logout` | Log out and clear authentication cookie |
| **POST** | `/projects` | Create a new project |
| **GET** | `/projects` | List all projects for the user |
| **GET** | `/projects/:id` | Get a specific project by ID |
| **PATCH** | `/projects/:id` | Update project details |
| **DELETE** | `/projects/:id` | Delete a project along with its tasks and scenarios |
| **POST** | `/projects/:projectId/tasks` | Add a task with optional dependencies |
| **GET** | `/projects/:projectId/tasks` | List all tasks for a project |
| **PATCH** | `/tasks/:id` | Update a task (automatically validates circular dependencies) |
| **DELETE** | `/tasks/:id` | Delete a task and remove it from dependent chains |
| **GET** | `/projects/:id/schedule` | Retrieve schedule, critical path, deadline status, and progress |
| **POST** | `/projects/:id/simulate` | Run a what-if simulation (transient, nothing is saved) |
| **POST** | `/projects/:id/scenarios` | Save a what-if simulation run as a named scenario |
| **GET** | `/projects/:id/scenarios` | List saved scenarios for a project |
| **GET** | `/scenarios/:id/run` | Execute a specific saved scenario |
| **DELETE** | `/scenarios/:id` | Delete a scenario |

---

## Deployment Guide

The server runs on Render, the client on Vercel, and persistent data lives on MongoDB Atlas.

1. **Atlas:** Create a database user and configure Network Access to allow `0.0.0.0/0` so your hosted Render server can connect. Copy your connection string and append a custom database name (e.g., `ripple_live`) before the `?`.
2. **Render (Server):** Create a Web Service from your repository with these settings:
   * **Root Directory:** `server`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Health Check Path:** `/health`
   * **Environment Variables:** `MONGO_URI`, `JWT_SECRET` (a strong random string), `NODE_ENV=production`, `NODE_VERSION=22`, and `CLIENT_URL` (your Vercel frontend domain).
3. **Vercel (Client):** Import your repository with **Root Directory** set to `client` and framework preset set to **Vite**. Add the environment variable `VITE_API_URL` set to your Render backend address (with no trailing slash) and deploy.
4. **Connect Them:** Ensure `CLIENT_URL` on Render matches your final Vercel frontend URL precisely, then trigger a redeploy of the server.

> **Note on Cookies:** The production login cookie uses `Secure` and `SameSite=None` flags so the client and server can communicate seamlessly across different domains.