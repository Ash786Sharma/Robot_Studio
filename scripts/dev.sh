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

# Build a browser-reachable URL for a port: the forwarded Codespaces domain
# when running in a Codespace, otherwise plain localhost.
url_for_port() {
  local port="$1"
  if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
    printf 'https://%s-%s.%s' "$CODESPACE_NAME" "$port" "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"
  else
    printf 'http://localhost:%s' "$port"
  fi
}

wait_for_http() {
  local url="$1" tries="${2:-30}"
  for ((i = 0; i < tries; i++)); do
    curl -fsS --max-time 2 "$url" >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

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

# Each service is started via `setsid` so it gets its own process group; killing
# the negative PID takes out the whole npm -> vite/tsx/drizzle-kit child tree
# instead of leaving orphans behind that block the port on the next run.
kill_group() {
  [[ -n "${1:-}" ]] && kill -- "-$1" 2>/dev/null || true
}

cleanup() {
  trap - TERM INT EXIT
  kill_group "$BACKEND_PID"
  kill_group "$FRONTEND_PID"
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
  setsid npm --prefix "$BACKEND_DIR" run dev &
  BACKEND_PID=$!
fi

printf 'Starting ONS frontend...\n'
if ss -ltn | grep -q ':5174'; then
  printf 'Port 5174 is already in use, assuming the ONS frontend is already running.\n'
else
  setsid npm --prefix "$FRONTEND_DIR" run dev &
  FRONTEND_PID=$!
fi

printf '\nWaiting for services to come online...\n'
wait_for_http 'http://localhost:3000/api/health' || printf 'Backend did not respond in time.\n' >&2
wait_for_http 'http://localhost:5174' || printf 'Frontend did not respond in time.\n' >&2

BACKEND_URL="$(url_for_port 3000)"
FRONTEND_URL="$(url_for_port 5174)"

printf '\nONS development stack is running.\n'
printf 'Backend:    %s\n' "$BACKEND_URL"
printf 'Health:     %s/api/health\n' "$BACKEND_URL"
printf 'API docs:   %s/api-docs\n' "$BACKEND_URL"
printf 'Frontend:   %s\n' "$FRONTEND_URL"
printf 'Database:   PostgreSQL on localhost:5432 (user: ons / pass: ons_dev_password / db: ons)\n'
printf '            Connect with the PostgreSQL VS Code extension or psql - see README.\n'
printf '\nPress Ctrl+C to stop the backend and frontend. PostgreSQL remains running.\n\n'

# Plain `wait` (no -n) blocks until ALL of these exit, so one service dying
# does not tear down the other.
wait_pids=()
[[ -n "$BACKEND_PID" ]] && wait_pids+=("$BACKEND_PID")
[[ -n "$FRONTEND_PID" ]] && wait_pids+=("$FRONTEND_PID")
if [[ ${#wait_pids[@]} -gt 0 ]]; then
  wait "${wait_pids[@]}" || true
fi
