---
name: railway-deploy
description: Containerization, multi-stage Docker build with Foundry toolchain, WebSocket keep-alive, and Railway deployment procedures for the OmniFlow backend.
---

# Railway Deployment & Container Infrastructure Skill

Use this skill whenever authoring or modifying the backend `Dockerfile`, `railway.toml`, container startup scripts, or deployment pipelines in `backend/`.

---

## 1. Multi-Stage Docker Architecture with Foundry

Because OmniFlow compiles and deploys customized Reactive Smart Contracts dynamically, the container MUST contain the **Foundry toolchain (`forge` and `cast`)**:

* **Multi-Stage Structure:**
  1. `foundry-bin`: Pull `ghcr.io/foundry-rs/foundry:latest` to extract pre-compiled `forge` and `cast` binaries.
  2. `builder`: Node.js 20 Debian image, install `pnpm`, compile TypeScript code for `backend` and `packages/shared`.
  3. `runner`: Node.js 20 Debian image, copy `forge` and `cast` to `/usr/local/bin/`, copy compiled JS and templates, install `git` and `curl`.

* **Verification in Dockerfile:**
  Always include:
  ```dockerfile
  RUN forge --version && cast --version
  ```
  to ensure binaries run without shared library linking issues on Debian Bookworm.

---

## 2. Dynamic Port Binding & Railway Configuration

* **Port Binding:** Railway assigns a dynamic port via the `$PORT` environment variable. Never hardcode port 8080 or 3000 in application code:
  ```typescript
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server listening on port ${PORT}`);
  });
  ```
* **Configuration (`railway.toml`):**
  ```toml
  [build]
  builder = "DOCKERFILE"
  dockerfilePath = "backend/Dockerfile"

  [deploy]
  healthcheckPath = "/health"
  healthcheckTimeout = 120
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 5

  [service]
  internalPort = 8080
  ```

---

## 3. WebSocket Heartbeat & Cloud Proxy Keep-Alive

Cloud proxies on Railway automatically terminate idle TCP connections after 60 seconds of silence. To maintain persistent WebSocket connections for live cross-chain event streaming:

* **Server-Side Ping Interval (Every 30 seconds):**
  ```typescript
  const interval = setInterval(() => {
    wss.clients.forEach((ws: CustomWebSocket) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  ```
* **Client-Side Pong & Auto-Reconnect:**
  Client responds with `pong` on native ping, and auto-reconnects using exponential backoff ($1\text{s} \rightarrow 2\text{s} \rightarrow 4\text{s} \dots$) if connection drops.

---

## 4. Health Check Endpoint (`GET /health`)

Railway queries this endpoint to verify container readiness before routing public traffic:

* Return `200 OK` when connected to Base Sepolia and Lasna RPCs.
* Return `503 Service Unavailable` if critical RPC connections fail.
* Include basic metrics: current block numbers, uptime, and memory usage.
