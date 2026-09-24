# Local build and run

## Option 1: Node.js

```bash
npm install
npm start
```

Open http://localhost:3000.

## Option 2: Docker

```bash
docker compose build
docker compose up
```

Open http://localhost:3000.

The Docker runner needs access to the Docker daemon because it creates short-lived language containers. For a public deployment, use a dedicated execution worker/VM rather than exposing the host Docker socket directly.
