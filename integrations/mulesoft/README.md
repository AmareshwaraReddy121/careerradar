# MuleSoft integration layer

CareerRadar uses MuleSoft (Anypoint Platform, Mule 4) as the API gateway in front of the Node/Express API (`apps/api`). The backend stays the system of record; Mule handles traffic management and, from Phase 2–3, the integrations that pull jobs and news from external sources.

```
Browser / mobile ──► Mule gateway (careerradar-gateway, :8081) ──► Express API (:4000) ──► MongoDB
                         ▲
               Anypoint API Manager policies
       (client-id enforcement, rate limiting, CORS, IP allowlist)
```

| Path                       | What                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| `api/careerradar-api.yaml` | OpenAPI 3 contract — publish to Anypoint Exchange, manage in API Manager |
| `careerradar-gateway/`     | Mule 4 application: transparent `/api/*` proxy + `/gateway/health`       |

## What the gateway does

- Forwards every `/api/*` request (method, path, query, headers, body) to the backend and returns the backend's status, headers (including `Set-Cookie` for the refresh cookie) and body unchanged.
- Strips hop-by-hop headers, adds `X-Forwarded-For/Proto/Host`, and propagates or creates `X-Correlation-ID`.
- Returns `502 UPSTREAM_UNAVAILABLE` / `504 UPSTREAM_TIMEOUT` JSON errors in the API's error format when the backend is down or slow.

When the API runs behind the gateway, set `TRUST_PROXY=1` in `apps/api/.env` so rate limiting and audit logs use the client IP from `X-Forwarded-For`.

## Run locally (Mule Community runtime, no Anypoint account needed)

Requires Java 17 and Maven 3.9+.

```bash
# 1. Build the app
(cd integrations/mulesoft/careerradar-gateway && mvn -B package)

# 2. Download the Mule 4 CE runtime once
curl -LO https://repository.mulesoft.org/nexus/content/repositories/releases/org/mule/distributions/mule-standalone/4.9.0/mule-standalone-4.9.0.tar.gz
tar xzf mule-standalone-4.9.0.tar.gz

# 3. Deploy and start
cp integrations/mulesoft/careerradar-gateway/target/careerradar-gateway-*-mule-application.jar mule-standalone-4.9.0/apps/
mule-standalone-4.9.0/bin/mule console

# 4. Send the web app through the gateway
VITE_API_PROXY=http://localhost:8081 pnpm dev
```

Check: `curl localhost:8081/gateway/health` and `curl localhost:8081/api/v1/health`.

Configuration (`src/main/resources/config.yaml`) can be overridden with `-M-Dbackend.host=…`, `-M-Dbackend.port=…`, `-M-Dhttp.port=…` or Runtime Manager properties.

## Deploy on Anypoint Platform (needs an Anypoint account)

1. **Exchange:** publish `api/careerradar-api.yaml` as an API spec asset.
2. **Runtime Manager:** deploy `careerradar-gateway` to CloudHub 2.0 (or a hybrid runtime) with `backend.host`, `backend.port` and `backend.protocol=HTTPS` set as properties.
3. **API Manager:** create an API instance from the Exchange asset and link it to the deployed app (autodiscovery), then apply policies:
   - Rate limiting (e.g. 300 requests/min per client; stricter on `/auth/*`)
   - Client ID enforcement for partner/mobile clients
   - CORS for the web origin, with credentials allowed
   - IP allowlist for `/admin/*` if required
4. Point the web app's `VITE_API_URL` to the gateway URL.
