import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

export const proxy = convexAuthNextjsMiddleware((request) => {
  const url = request.nextUrl;
  const token = url.searchParams.get("token");

  if (token) {
    const ordersMatch = url.pathname.match(/^\/orders\/([^/]+)/);
    if (ordersMatch) {
      const organizationId = ordersMatch[1];
      const cookieName = `order_session_${organizationId}`;
      const redirectUrl = url.clone();
      redirectUrl.searchParams.delete("token");
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
      return response;
    }

    const availMatch = url.pathname.match(/^\/availability\/([^/]+)/);
    if (availMatch) {
      const organizationId = availMatch[1];
      const cookieName = `availability_session_${organizationId}`;
      const redirectUrl = url.clone();
      redirectUrl.searchParams.delete("token");
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
      return response;
    }
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

