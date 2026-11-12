import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Admin pages anyone may open without a session. */
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // Refreshes the session cookie if needed. Do not put code between createServerClient and getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminPath = path === "/admin" || path.startsWith("/admin/");

  if (isAdminPath && !user && !PUBLIC_ADMIN_PATHS.has(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    if (path !== "/admin") url.searchParams.set("next", path + request.nextUrl.search);
    const redirect = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    redirect.headers.set("X-Robots-Tag", "noindex, nofollow");
    return redirect;
  }

  if (isAdminPath) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/auth/:path*"],
};
