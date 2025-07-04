import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
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
      const [user, pwd] = atob(authValue).split(":");

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

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes that should remain public
     * - static files (_next/static)
     * - images, icons, etc.
     * - health check endpoints
     */
    "/((?!api/public|_next/static|_next/image|favicon.ico|health|metrics).*)",
  ],
};
