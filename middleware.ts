import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyFirebaseToken } from "./lib/verify-firebase-token";
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  const isLoginRoute = pathname === "/login";

  if (!token) {
    if (!isLoginRoute) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  }

  const user = await verifyFirebaseToken(token);

  if (!user) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
