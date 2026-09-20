# Robot Studio

One Automation Studio (ONS) is a robotics and industrial automation IDE. The
active application consists of a React frontend, a Node.js backend, a
PostgreSQL database, and a planned Linux/FPGA controller runtime.

## Architecture

```text
React + Vite frontend
	|
	| REST HTTP + raw WebSocket
	v
Node.js + Express backend
	|
	+-- PostgreSQL: users, projects, file-tree metadata, devices, robot library
	+-- Local storage: project file contents, meshes, and derived .ord robot descriptions
	+-- WebSocket: live project file synchronization, and a per-project PTY terminal
	|
	v
Linux controller with FPGA
	|
	+-- C/C++ deterministic kinematics and control
	+-- PLC, HMI, and robot program runtime
```

Python notebooks are used for research, testing, kinematics verification,
trajectory planning, and neural-network training. They are not the production
runtime. Production kinematics and neural-network inference will run as C/C++
code on the Linux/FPGA controller.

## Repository Structure

```text
Robot_Studio/
├── README.md
├── new_React/
│   ├── ONS/                         # React + Vite frontend
│   ├── ONSBackend/                  # Node.js + Express backend
│   └── ...
├── notebook/
│   ├── UR5_DQ_Kinematics.ipynb     # Dual-quaternion FK, IK, Jacobian
│   ├── UR5_Trajectory_planning.ipynb
│   ├── UR5_NN_Hybrid_kinematics.ipynb
│   └── Foc_Adrc.ipynb               # FOC/ADRC research
└── app/                             # Legacy Next.js API code
```

`new_React/ONS` and `new_React/ONSBackend` are the active applications. The
legacy `app/` directory is not used by the current workflow.

For a deeper dive into how the frontend, backend, and database fit together
(with diagrams) — useful before contributing a feature or fix — see
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Technology Stack

### Frontend

- React 19, TypeScript, and Vite
- Zustand for application state
- TanStack Query for server state and caching
- Tailwind CSS and Base UI/shadcn components
- Monaco Editor for text editing
- React Flow for graph-based editors
- React Konva for HMI design
- React Three Fiber, Three.js, URDF Loader, and Rapier for 3D simulation
- `@xterm/xterm` (via `react-xtermjs`) for the in-IDE terminal
- Native browser WebSocket API for live file synchronization and the terminal

### Backend

- Node.js and Express 5
- TypeScript with native ESM
- PostgreSQL 16 with Drizzle ORM and Drizzle Kit
- Zod request validation
- JWT authentication
- `ws` for raw WebSockets, `node-pty` for real per-project terminal shells
- `multer` for multipart uploads (robot description/mesh files), `fast-xml-parser` for URDF parsing
- Pino logging, Helmet security headers, and rate limiting
- Swagger UI/OpenAPI documentation
- Local disk storage for project file contents

### Research and Controller Runtime

- Python, NumPy, SciPy, Matplotlib, and TensorFlow/Keras
- C/C++ for deterministic controller-side execution
- FPGA acceleration for control and neural-network inference where required
- Golden fixtures to keep Python, C/C++, and frontend calculations consistent

## Backend Structure

```text
new_React/ONSBackend/
├── docker-compose.yml
├── drizzle.config.ts
├── package.json
├── .env.example
├── src/
│   ├── app.ts                       # Express app and middleware
│   ├── server.ts                    # HTTP and WebSocket startup
│   ├── config/                      # Environment and logger
│   ├── db/                          # Drizzle client, schemas, migrations
│   ├── modules/
│   │   ├── auth/                    # Signup, login, WS tickets
│   │   ├── projects/                # Project CRUD
│   │   ├── files/                   # File tree and content CRUD
│   │   ├── devices/                 # Robot/PLC/HMI devices, folder scaffolding
│   │   └── robots/                  # .ord schema, URDF import, robot library
│   ├── middlewares/                 # Auth, validation, errors
│   ├── storage/                     # Local storage provider
│   ├── ws/                          # File-sync and terminal WebSocket gateways
│   ├── errors/
│   ├── types/
│   └── utils/
└── tests/
```

## Frontend Structure

```text
new_React/ONS/src/
├── app/                             # App entry point and providers
├── components/ui/                  # Shared UI primitives
├── config/                          # Editor and navigation JSON
├── mocks/                           # Development-only mock data
├── core/
│   ├── api/                         # Typed HTTP API clients
│   ├── socket/                      # WebSocket hooks
│   └── store/                       # Zustand stores
├── features/
│   ├── auth/                        # Login and authentication gate
│   ├── console/                     # xterm.js terminal, backed by a real PTY shell
│   ├── editor/                      # Monaco, graph, HMI, DB, and device config editors
│   ├── ide-shell/                   # IDE layout, navigation, file tree, New Project modal
│   ├── simulation/                  # 3D viewer and viewport
│   └── workflow/
├── hooks/
├── lib/
└── globals.css
```

## Prerequisites

- Node.js 24 or newer
- npm
- Docker with Docker Compose
- Git
- A C/C++ toolchain and Python (only needed if `npm install` in
  `new_React/ONSBackend` has to build `node-pty` from source instead of using
  a prebuilt binary for your platform)

## First-Time Setup

Install the frontend:

```bash
cd /workspaces/Robot_Studio/new_React/ONS
npm install
```

Install and configure the backend:

```bash
cd /workspaces/Robot_Studio/new_React/ONSBackend
npm install
cp .env.example .env
```

The backend `.env` should contain:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://ons:ons_dev_password@localhost:5432/ons
JWT_SECRET=local_dev_secret_please_change_me_123
STORAGE_ROOT=./storage
```

Never commit `.env` or production secrets.

## Database

Start PostgreSQL:

```bash
cd /workspaces/Robot_Studio/new_React/ONSBackend
docker compose up -d postgres
docker compose ps
```

The development database is:

```text
Host: localhost       Port: 5432
Database: ons         User: ons
Password: ons_dev_password
```

Apply migrations:

```bash
npm run db:migrate
```

The same Drizzle Kit commands are available from the repository root:

```bash
npm run db:generate  # Generate a migration after changing a schema
npm run db:migrate   # Apply pending migrations
```

The current schema contains:

- `users` — registered ONS users
- `projects` — project metadata and ownership
- `file_nodes` — project folders, files, names, types, and local-storage keys
- `devices` — robot/PLC/HMI devices attached to a project (one per kind for now)
- `robot_library_entries` — reusable robot descriptions (`.ord`), independent of any project

After changing a Drizzle schema:

```bash
npm run db:generate
npm run db:migrate
```

### Connecting a database client

Use a regular Postgres client instead of Drizzle Studio or Adminer — it works
the same way whether you're on `localhost` or a forwarded Codespaces tab:

- **VS Code PostgreSQL extension** (`ms-ossdata.vscode-pgsql`): open the
  elephant icon in the Activity Bar → **Add Connection**, then use
  `Host: localhost`, `Port: 5432`, `Database: ons`, `User: ons`,
  `Password: ons_dev_password`.
- **`psql` CLI**:

  ```bash
  psql "postgres://ons:ons_dev_password@localhost:5432/ons"
  ```

Both connect directly to the `postgres` container port published by
`docker-compose.yml`, so PostgreSQL must be running first (see above).

## Running the Applications

### One-command startup

From the repository root, start PostgreSQL, apply migrations, and launch both
the backend and frontend with one command:

```bash
cd /workspaces/Robot_Studio
npm run dev
```

This command:

1. Installs frontend/backend dependencies if their `node_modules` directories
	are missing.
2. Starts PostgreSQL through Docker Compose and waits for it to become
	healthy.
3. Applies the Drizzle migrations.
4. Reuses a healthy ONS backend already running on port `3000`, or starts one.
5. Starts the Vite frontend (fixed at port `5174`), reusing it if already
	running.
6. Waits for backend/frontend to actually respond, then prints the correct
	URL for each — using the forwarded `https://<codespace>-<port>
	.app.github.dev` address automatically when running in a Codespace.
7. Stops the backend and frontend child processes when you press `Ctrl+C`.
	One of them exiting on its own does not stop the other.

PostgreSQL remains running after `Ctrl+C`. Stop it separately with:

```bash
cd /workspaces/Robot_Studio/new_React/ONSBackend
docker compose down
```

Connect to the database with the PostgreSQL VS Code extension or `psql` (see
the Database section above) — no extra service needs to be started for that.

If the launcher reports a port already in use for the backend or frontend, it
prints a message and reuses the existing one instead of crashing. Check
listeners with:

```bash
ss -ltnp | grep -E ':3000|:5174'
```

### Manual startup alternative

Use the following separate-terminal commands when you need to start or restart
only one part of the stack.

### Terminal 1: PostgreSQL

```bash
cd /workspaces/Robot_Studio/new_React/ONSBackend
docker compose up -d postgres
```

### Terminal 2: Backend

```bash
cd /workspaces/Robot_Studio/new_React/ONSBackend
npm run dev
```

Backend URLs:

```text
API:       http://localhost:3000
Health:    http://localhost:3000/api/health
Docs:      http://localhost:3000/api-docs
WebSocket: ws://localhost:3000/ws/files, ws://localhost:3000/ws/terminal
```

If `npm run dev` reports `EADDRINUSE` for port `3000`, the backend is already
running. Verify the existing instance before starting another one:

```bash
curl http://localhost:3000/api/health
```

If the response is `{"success":true,"message":"ONS backend is running"}`,
reuse that server and do not start a second process. If you need to restart it,
stop the existing backend terminal with `Ctrl+C`, then run `npm run dev` again.
To identify the process using the port:

```bash
ss -ltnp | grep ':3000'
```

### Terminal 3: Frontend

```bash
cd /workspaces/Robot_Studio/new_React/ONS
npm run dev
```

Open the URL printed by Vite: `http://localhost:5174`. The port is fixed
(`strictPort` in `vite.config.ts`) so it never silently falls back to a
different port — if `5174` is already taken by another instance, Vite exits
with an error instead.

## GitHub Codespaces

This repository has no `devcontainer.json`, so forwarded ports are **not**
automatic — GitHub only creates a forwarded URL for a port once something in
your connected editor session has registered it. If a forwarded URL
(`https://<codespace>-<port>.app.github.dev`) shows "No webpage was found"
even though `npm run dev` says the service is running, the port simply isn't
forwarded yet:

1. Open the **PORTS** tab in VS Code (next to the Terminal panel).
2. Click **Forward a Port** and add `3000` (backend) and `5174` (frontend).
3. These are remembered for this Codespace, so this is normally a one-time
   step per Codespace, not per session.

During `npm run dev`, the frontend proxies `/api` requests to `localhost:3000`
inside the container (`vite.config.ts`), so the browser only ever talks to the
frontend's own origin — no CORS configuration or separate backend URL is
needed for the app itself to work once its port is forwarded. Forwarded URLs
follow this pattern:

```text
Frontend: https://<codespace>-5174.app.github.dev
Backend:  https://<codespace>-3000.app.github.dev
```

PostgreSQL (port `5432`) does not need to be forwarded — connect to it with
the PostgreSQL VS Code extension or `psql` from inside the Codespace/container
(see the Database section above), not from a browser tab.

These ports default to **private** visibility, which is correct for local
development — opening them prompts a GitHub login (you, as the owner) rather
than being world-readable. Do not switch them to public just to make them
load; if a private forwarded URL doesn't load, it means the port isn't
forwarded yet (see steps above), not that visibility needs to change.

Backend CORS (`CORS_ORIGIN` in `.env`) only matters if you call the API
directly from a different origin than the frontend dev proxy, e.g. Swagger
UI's "Try it out" or a standalone script.

## API Overview

Protected endpoints use:

```http
Authorization: Bearer <jwt>
```

Authentication:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/ws-ticket
```

Projects:

```text
GET  /api/projects
POST /api/projects
GET  /api/projects/:id
```

Project files:

```text
GET    /api/projects/:projectId/files
POST   /api/projects/:projectId/files
GET    /api/projects/:projectId/files/:fileId/content
PUT    /api/projects/:projectId/files/:fileId/content
PATCH  /api/projects/:projectId/files/:fileId
DELETE /api/projects/:projectId/files/:fileId
```

Devices (robot/PLC/HMI, scaffolds the device's folder tree on creation):

```text
GET    /api/projects/:projectId/devices
POST   /api/projects/:projectId/devices
DELETE /api/projects/:projectId/devices/:deviceId
```

`POST` is `multipart/form-data`: `kind` (`robot`|`plc`|`hmi`), `name`, and for
robots either `libraryEntryId` (clone from the robot library) or an uploaded
`ord` file, or a `urdf` file plus its `meshes` (`.stl`/`.dae`/`.obj`/`.gltf`/`.glb`).

Robot library (reusable `.ord` robot descriptions, independent of any project):

```text
GET    /api/robot-library
POST   /api/robot-library
GET    /api/robot-library/:id
DELETE /api/robot-library/:id
```

The frontend obtains a short-lived ticket through `/api/auth/ws-ticket` and
opens `/ws/files?ticket=<ticket>&projectId=<project-id>`. Supported messages
are `file:create`, `file:update`, `file:rename`, and `file:delete`.

The same ticket also authorizes `/ws/terminal?ticket=<ticket>&projectId=<project-id>`,
which spawns a real PTY-backed shell (`node-pty`) cwd'd into that project's
storage directory — one shell process per socket, killed on disconnect. The
frontend's `useTerminal` hook wires this to an `xterm.js` instance; messages
are `{ type: "input" | "resize" }` (client to server) and
`{ type: "output" | "exit" }` (server to client).

## Validation and Tests

Backend build and tests:

```bash
cd /workspaces/Robot_Studio/new_React/ONSBackend
npm run build
npm test
```

Frontend build:

```bash
cd /workspaces/Robot_Studio/new_React/ONS
npm run build
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"success":true,"message":"ONS backend is running"}
```

## Stopping Services

Stop the frontend and backend with `Ctrl+C` in their terminals.

Stop PostgreSQL while preserving its data:

```bash
cd /workspaces/Robot_Studio/new_React/ONSBackend
docker compose down
```

Delete PostgreSQL data too, only when a fresh database is intended:

```bash
docker compose down -v
```

## Future Runtime Pipeline

```text
React editors
  -> frontend JSON/text
  -> compiler intermediate representation
  -> PLC/robot/HMI code generation
  -> C/C++ target code
  -> Linux + FPGA controller
```

The planned compiler will translate graph editor JSON, structured text, data
blocks, HMI definitions, and robot programs into a common intermediate
representation. PLC-oriented programs should target PLCOpen XML and reuse
`matiec` where appropriate. Robot and HMI programs will use custom code
generation for the controller runtime.

The UR5 notebooks are the Python reference implementation for dual-quaternion
forward kinematics, inverse kinematics, Jacobians, ScLERP, trajectory planning,
and hybrid neural-network IK. Their outputs will become golden fixtures for the
future C/C++ controller implementation.
