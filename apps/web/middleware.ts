import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";

const ADMIN_PREFIXES = ["/admin", "/api/admin"];

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return false;
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (!secret) {
    // Explicit opt-in only — never open admin just because NODE_ENV=development.
    if (process.env.ALLOW_DEV_ADMIN_BYPASS === "true" && process.env.NODE_ENV !== "production") {
      return NextResponse.next();
    }
    return new NextResponse("Admin auth is not configured. Set ADMIN_AUTH_SECRET.", { status: 503 });
  }

  if (await isAdminAuthorized(request)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
