type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  maxRequests: number
  windowMs: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL_MS = 60_000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
  cleanupTimer.unref?.()
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const real = request.headers.get('x-real-ip')
  if (real) {
    return real
  }

  return 'unknown'
}

function isRateLimited(
  key: string,
  { maxRequests, windowMs }: RateLimitOptions
): { limited: boolean; remaining: number; resetAt: number } {
  startCleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return {
      limited: false,
      remaining: maxRequests - 1,
      resetAt: now + windowMs
    }
  }

  entry.count += 1
  const remaining = Math.max(0, maxRequests - entry.count)

  return {
    limited: entry.count > maxRequests,
    remaining,
    resetAt: entry.resetAt
  }
}

const READ_LIMIT: RateLimitOptions = { maxRequests: 100, windowMs: 60_000 }
const WRITE_LIMIT: RateLimitOptions = { maxRequests: 20, windowMs: 60_000 }

type HandlerContext = { request: Request }

export function withRateLimit<T extends HandlerContext>(
  handler: (ctx: T) => Promise<Response>,
  options?: RateLimitOptions
) {
  return async (ctx: T): Promise<Response> => {
    const method = ctx.request.method
    const limit =
      options ??
      (method === 'GET' || method === 'HEAD' ? READ_LIMIT : WRITE_LIMIT)

    const ip = getClientIp(ctx.request)
    const key = `${ip}:${new URL(ctx.request.url).pathname}`
    const { limited, remaining, resetAt } = isRateLimited(key, limit)

    if (limited) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
      return new Response(
        JSON.stringify({
          message: 'Too many requests. Please try again later.'
        }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000))
          }
        }
      )
    }

    const response = await handler(ctx)

    response.headers.set('X-RateLimit-Limit', String(limit.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))

    return response
  }
}
