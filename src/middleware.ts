import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    if (!req.nextauth.token) {
      // Explicitly redirect to our custom sign-in page
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/sign-in", // Specify the custom sign-in page path
    },
  }
);

export const config = {
  matcher: [
    "/schedule/:path*",
    "/dashboard/:path*",
    "/attendance/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};