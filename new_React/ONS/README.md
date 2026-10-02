# ONS Frontend

The active ONS frontend is a React 19, TypeScript, and Vite IDE. It provides
project/file management, graph and HMI editors, source control, a PTY-backed
terminal, and an `.ord`-driven robot viewer. See the [repository README](../../README.md)
for full-stack setup and the [architecture guide](../../docs/ARCHITECTURE.md)
for implementation details.

## Development

Run the full stack from the repository root with `npm run dev`, or start only
the frontend after the backend is available:

```bash
npm install
npm run dev
```

Vite serves the UI at `http://localhost:5174` and proxies API requests to the
backend on port `3000`.

## Checks

```bash
npm run build
npm run lint
```
