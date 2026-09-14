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
	+-- PostgreSQL: users, projects, file-tree metadata
	+-- Local storage: project file contents and assets
	+-- WebSocket: live project file synchronization
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
- Native browser WebSocket API for live file synchronization

### Backend

- Node.js and Express 5
- TypeScript with native ESM
- PostgreSQL 16 with Drizzle ORM and Drizzle Kit
- Zod request validation
- JWT authentication
- `ws` for raw WebSockets
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
│   │   └── files/                   # File tree and content CRUD
│   ├── middlewares/                 # Auth, validation, errors
│   ├── storage/                     # Local storage provider
│   ├── ws/                          # Raw WebSocket synchronization
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
│   ├── console/                     # Terminal UI
│   ├── editor/                      # Monaco, graph, HMI, and DB editors
│   ├── ide-shell/                   # IDE layout, navigation, file tree
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

Drizzle Kit is the database toolkit used by the backend. Open Drizzle Studio
to browse and edit PostgreSQL data in a visual database interface. Studio is an
optional separate process and is intentionally not started by `npm run dev`.
This avoids keeping an unnecessary database UI open and avoids port `4983`
conflicts.

```bash
npm run db:studio
```

The same Drizzle Kit commands are available from the repository root:

```bash
npm run db:generate  # Generate a migration after changing a schema
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Start the database browser
```

Drizzle Studio connects using `DATABASE_URL` from `ONSBackend/.env`. When using
Codespaces, open the Studio web UI with the forwarded bridge host and port:

```text
https://local.drizzle.studio/?host=<codespace>-4983.app.github.dev&port=443
```

Because the Studio UI runs in the browser outside the container, port `4983`
must be reachable through the Codespaces tunnel. For a temporary development
session, set the port to public, then return it to private when finished:

```bash
gh codespace ports visibility 4983:public --codespace "$CODESPACE_NAME"
# use Drizzle Studio
gh codespace ports visibility 4983:private --codespace "$CODESPACE_NAME"
```

On a local machine, Drizzle may also print
[https://local.drizzle.studio](https://local.drizzle.studio). The current schema
contains:

- `users` — registered ONS users
- `projects` — project metadata and ownership
- `file_nodes` — project folders, files, names, types, and local-storage keys

Keep PostgreSQL running while using Studio. Stop Studio with `Ctrl+C` in its
terminal. After changing a schema, generate and apply a migration before
expecting the new table or column to appear:

If Studio reports `EADDRINUSE` for port `4983`, another Studio instance is
already running. Open the existing forwarded URL instead of starting a second
instance. Alternatively, start another instance on a different port and expose
that port through the Codespaces Ports panel:

```bash
npm run db:studio -- --port 4984
```

To find the process using the default Studio port:

```bash
ss -ltnp | grep ':4983'
```

After changing a Drizzle schema:

```bash
npm run db:generate
npm run db:migrate
```

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
2. Starts PostgreSQL through Docker Compose and waits for it to become ready.
3. Applies the Drizzle migrations.
4. Reuses a healthy ONS backend already running on port `3000`, or starts one.
5. Starts the Vite frontend.
6. Stops the backend and frontend child processes when you press `Ctrl+C`.

PostgreSQL remains running after `Ctrl+C`. Stop it separately with:

```bash
cd /workspaces/Robot_Studio/new_React/ONSBackend
docker compose down
```

If the launcher reports `EADDRINUSE`, an older backend or frontend process is
already running. Reuse that existing process or stop it before running the
root command again. Check listeners with:

```bash
ss -ltnp | grep -E ':3000|:5173|:5174'
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
WebSocket: ws://localhost:3000/ws/files
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

Open the URL printed by Vite. It is normally `http://localhost:5173`. If that
port is occupied, Vite automatically selects another port such as `5174`.

## GitHub Codespaces

When using a Codespaces forwarded HTTPS URL, do not hardcode `localhost` in the
browser. The frontend automatically detects the forwarded backend URL from
`window.location` when `VITE_API_URL` and `VITE_WS_URL` are not set.

The backend port must be reachable from the browser. In Codespaces, make port
3000 public or otherwise accessible through the Ports panel. Forwarded URLs
follow this pattern:

```text
Frontend: https://<codespace>-5174.app.github.dev
Backend:  https://<codespace>-3000.app.github.dev
```

If Vite uses another port, use the URL printed in its terminal. Development
CORS accepts localhost ports and GitHub Codespaces origins; production should
use one explicit `CORS_ORIGIN`.

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

The frontend obtains a short-lived ticket through `/api/auth/ws-ticket` and
opens `/ws/files?ticket=<ticket>&projectId=<project-id>`. Supported messages
are `file:create`, `file:update`, `file:rename`, and `file:delete`.

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
