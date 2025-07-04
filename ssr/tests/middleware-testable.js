/**
 * Testable version of the middleware for unit testing
 * This recreates the middleware logic in a Node.js compatible format
 */

// Mock NextResponse for testing
class NextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  static next() {
    return new NextResponse(null, { status: 200 });
  }
}

/**
 * Testable middleware function that replicates the logic from middleware.ts
 */
function middleware(request) {
  // Skip auth for health check endpoints and API routes that should remain public
  if (
    request.nextUrl.pathname.startsWith("/health") ||
    request.nextUrl.pathname.startsWith("/metrics") ||
    request.nextUrl.pathname.startsWith("/api/public")
  ) {
    return NextResponse.next();
  }

  // Check if basic auth is enabled
  const authEnabled = ["true", "1", "yes"].includes(
    (process.env.SITE_PASSWORD_ENABLED || "").toLowerCase(),
  );
  if (!authEnabled) {
    return NextResponse.next();
  }

  const basicAuth = request.headers.get("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    try {
      const [user, pwd] = Buffer.from(authValue, "base64")
        .toString()
        .split(":");

      const expectedUser = process.env.SITE_USERNAME || "admin";
      const expectedPassword = process.env.SITE_PASSWORD || "";

      if (user === expectedUser && pwd === expectedPassword) {
        return NextResponse.next();
      }
    } catch (error) {
      // Invalid base64 encoding
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Site"',
    },
  });
}

module.exports = {
  middleware,
  NextResponse,
};
