import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "mpf_admin_local";

function isBypassAllowed(): boolean {
  return (
    process.env.ALLOW_DEV_ADMIN_BYPASS === "true" && process.env.NODE_ENV !== "production"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (!secret) {
    if (isBypassAllowed()) return NextResponse.next();
    return new NextResponse(
      "Admin auth is not configured. Set ADMIN_AUTH_SECRET (or ALLOW_DEV_ADMIN_BYPASS=true for local).",
      { status: 503 }
    );
  }

  const cookie = request.cookies.get(COOKIE)?.value;
  if (cookie === secret) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
