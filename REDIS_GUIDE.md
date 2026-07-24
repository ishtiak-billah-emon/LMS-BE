# Redis caching guide

## Why `REDIS_URL` is needed

Redis is a separate server from Node.js and MongoDB. `REDIS_URL` tells this
backend where that server is located and how to authenticate to it.

The backend uses RESP2 compatibility mode, so it also works with older Redis
servers that do not support the Redis 6+ `HELLO` command.

For a Redis server running on the same computer with its default settings:

```env
REDIS_URL=redis://localhost:6379
```

- `redis://` is the Redis protocol.
- `localhost` means "this computer".
- `6379` is Redis's default port.

This value does **not** install or start Redis. It only lets the LMS connect to
an already-running Redis server.

## Setup

1. Start Redis locally. With Docker installed, this is one option:

   ```powershell
   docker run --name lms-redis -p 6379:6379 -d redis:7-alpine
   ```

2. Add the URL to the real `.env` file:

   ```env
   REDIS_URL=redis://localhost:6379
   ```

3. Start the backend as usual:

   ```powershell
   npm run dev
   ```

4. On startup, the terminal should show `Redis connected.`. If it instead says
   caching is disabled, check that Redis is running and that the URL is correct.

For a hosted Redis provider, use the URL supplied by the provider. It commonly
looks like this:

```env
REDIS_URL=rediss://:your-password@your-redis-host:port
```

Use `rediss://` when the provider requires TLS. Keep the full URL private and
never commit it to Git.

## How the implementation works

The backend uses the cache-aside pattern:

1. A public read endpoint asks Redis for its cache key.
2. On a cache hit, Redis returns the saved JSON immediately; MongoDB is not
   queried for that response.
3. On a cache miss, the backend reads MongoDB, returns the result, and saves a
   JSON copy in Redis with a TTL.
4. When content changes, the write service/controller clears or versions the
   related Redis keys. The next public request reads fresh data from MongoDB.

MongoDB remains the source of truth. Redis only holds disposable copies.

## What is cached

| Data | TTL | Invalidation |
| --- | ---: | --- |
| Published course list | 5 minutes | Any course/review content change |
| Featured course list | 5 minutes | Any course/review content change |
| Public course detail | 10 minutes | Change to that course or its reviews |
| Public blog list (not free-text search) | 5 minutes | Blog create/update/delete/status/feature change |
| Public blog detail | 10 minutes | Change/delete of that blog |
| Course reviews list | 2 minutes | Review create/delete |
| Individual review | 5 minutes | Review delete |

Personalized values are deliberately not shared-cached: enrollment status,
lesson progress, completed lessons, private teacher/admin lists, and JWT data.
This prevents one user from receiving another user's information.

## Cache keys and invalidation

Course and blog list keys include a version number, for example:

```text
lms:course:catalog:v4:page:1:limit:12
lms:blog:catalog:v7:page:1:limit:12:tag::featured:
```

When a course or blog changes, the backend increments its catalog version.
Future reads use a new key immediately; old keys disappear when their TTL
expires. This avoids slow Redis-wide key scans.

Single items use direct keys, for example:

```text
lms:course:public:javascript-basics
lms:blog:public:how-to-study-effectively
```

Those are deleted directly after the relevant item changes.

## Failure behavior

Redis is optional in this implementation:

- No `REDIS_URL`: caching is disabled and requests use MongoDB.
- Redis is down: cache calls log an error and requests use MongoDB.
- Redis reconnects: caching resumes when the client is ready.

Redis will not intentionally take the LMS offline. The initial connection uses
a short timeout and limited retry attempts to avoid blocking startup for long.

## Useful local commands

If Redis is running in the Docker container above:

```powershell
docker exec -it lms-redis redis-cli ping
docker exec -it lms-redis redis-cli --scan --pattern "lms:*"
```

`PING` should return `PONG`. The scan command lets you inspect LMS cache keys
without using the expensive `KEYS *` command.

To stop and later restart the local container:

```powershell
docker stop lms-redis
docker start lms-redis
```
