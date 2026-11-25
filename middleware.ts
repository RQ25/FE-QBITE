import { NextResponse, NextRequest } from "next/server";

export const middleware = async (request: NextRequest) => {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  // Cek apakah pengguna mencoba mengakses halaman pengurus (/manager)
  if (request.nextUrl.pathname.startsWith("/manager")) {
    if (!token || !role) {
      const redirectLogin = request.nextUrl.clone();
      redirectLogin.pathname = "/login";
      return NextResponse.redirect(redirectLogin);
    }

    // Hanya ADMIN dan STAFF yang boleh mengakses area pengurus
    if (role !== "ADMIN" && role !== "STAFF") {
      const redirectLogin = request.nextUrl.clone();
      redirectLogin.pathname = "/login";
      return NextResponse.redirect(redirectLogin);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/manager/:path*", // Menangkap semua rute di bawah /manager
  ],
};