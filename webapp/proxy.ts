import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const token = url.searchParams.get("token");

  if (token) {
    const isAvailability = url.pathname.startsWith("/availability/");
    const isOrders = url.pathname.startsWith("/orders/");

    if (isAvailability || isOrders) {
      const parts = url.pathname.split("/");
      const orgId = parts[2];

      if (orgId) {
        const cookieName = isAvailability
          ? `availability_session_${orgId}`
          : `order_session_${orgId}`;

        // Remove token from URL for clean address bar
        url.searchParams.delete("token");
        const response = NextResponse.redirect(url);

        // Set secure HTTP-only cookie
        response.cookies.set(cookieName, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365, // 1 year
        });

        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/availability/:path*", "/orders/:path*"],
};
