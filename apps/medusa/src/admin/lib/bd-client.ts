/**
 * Minimal same-origin client for Bangladesh admin extensions.
 *
 * The embedded admin SPA and the /admin API share origin in both
 * `medusa develop` (CLI-proxied vite) and `medusa start` (served bundle),
 * so relative URLs + session cookies are always correct. Body handling is
 * intentionally explicit: non-2xx responses surface the API's structured
 * error JSON (statusCode / error / message) instead of a generic throw.
 */
export class BdApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "BdApiError"
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    let code = "UNKNOWN_ERROR"
    try {
      const body = await res.json()
      if (body?.message) message = body.message
      if (body?.error) code = body.error
    } catch {
      // Non-JSON error body — keep defaults.
    }
    throw new BdApiError(res.status, code, message)
  }

  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export const bdClient = {
  fetch: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
}
