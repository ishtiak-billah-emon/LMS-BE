# LMS backend

## Redis cache

Set `REDIS_URL` in `.env` (for local Redis: `redis://localhost:6379`). The API
continues to serve MongoDB data when Redis is unavailable or not configured.

The cache covers public course lists, featured courses, public course details,
public blog lists/details, and course reviews. Course, blog, and review writes
invalidate their related cache entries automatically.

For setup, cache workflow, production URL format, and troubleshooting, read
[REDIS_GUIDE.md](./REDIS_GUIDE.md).
