#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/new_React/ONSBackend"
FRONTEND_DIR="$ROOT_DIR/new_React/ONS"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  }
}

require_command docker
require_command npm
require_command curl
require_command ss

BACKEND_PID=""
FRONTEND_PID=""

if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  printf 'Installing backend dependencies...\n'
  npm --prefix "$BACKEND_DIR" install
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  printf 'Installing frontend dependencies...\n'
  npm --prefix "$FRONTEND_DIR" install
fi

printf 'Starting PostgreSQL...\n'
docker compose -f "$BACKEND_DIR/docker-compose.yml" up -d --wait postgres

printf 'Applying database migrations...\n'
npm --prefix "$BACKEND_DIR" run db:migrate

cleanup() {
  trap - TERM INT EXIT
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup TERM INT EXIT

health_response="$(curl -fsS --max-time 2 http://localhost:3000/api/health 2>/dev/null || true)"
if [[ "$health_response" == *"ONS backend is running"* ]]; then
  printf '\nUsing the existing healthy ONS backend on port 3000.\n'
else
  if ss -ltn | grep -q ':3000'; then
    printf '\nPort 3000 is occupied by a process that is not the ONS backend.\n' >&2
    printf 'Stop that process or run the backend on another port before retrying.\n' >&2
    exit 1
  fi

  printf '\nStarting ONS backend...\n'
  npm --prefix "$BACKEND_DIR" run dev &
  BACKEND_PID=$!
fi

printf 'Starting ONS frontend...\n'
npm --prefix "$FRONTEND_DIR" run dev &
FRONTEND_PID=$!

printf '\nONS development stack is running.\n'
printf 'Backend:  http://localhost:3000\n'
printf 'Health:   http://localhost:3000/api/health\n'
printf 'Frontend: use the Vite URL printed below (usually http://localhost:5173)\n'
printf 'Database: PostgreSQL on localhost:5432\n'
printf '\nPress Ctrl+C to stop the backend and frontend. PostgreSQL remains running.\n\n'

if [[ -n "$BACKEND_PID" ]]; then
  wait -n "$BACKEND_PID" "$FRONTEND_PID"
else
  wait "$FRONTEND_PID"
fi
