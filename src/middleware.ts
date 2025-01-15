import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect from schedule to start if day not started
    if (path.startsWith('/schedule') && token.isDateStarted === false) {
      return NextResponse.redirect(new URL("/start", req.url));
    }

    // Redirect from start to schedule if day is already started
    if (path.startsWith('/start') && token.isDateStarted === true) {
      return NextResponse.redirect(new URL("/schedule", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/sign-in",
    },
  }
);

export const config = {
  matcher: [
    "/schedule/:path*",
    "/dashboard/:path*",
    "/attendance/:path*",
    "/timetable/:path*",
    "/settings/:path*",
    "/calendar/:path*",
    "/exchange/:path*",
    "/timetable/:path*",
    "/start/:path*",
    "/start",
  ],
};