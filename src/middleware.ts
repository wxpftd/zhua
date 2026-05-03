import { type NextRequest, NextResponse } from "next/server";

const REALM = "ZHUA Founder Log";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

export function middleware(request: NextRequest): NextResponse {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // /reports/* is the public Research Reports surface (ZHUA-8). It deliberately
  // bypasses the basic-auth gate; never serve auth-gated content under that path.
  if (request.nextUrl.pathname.startsWith("/reports")) {
    return NextResponse.next();
  }

  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  // Fail-closed: a misconfigured deploy must NOT silently expose the Hypothesis Ledger.
  if (!expectedUser || !expectedPassword) {
    return new NextResponse("Auth gate misconfigured: BASIC_AUTH_USER/PASSWORD unset", {
      status: 503,
    });
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return unauthorized();

  const user = decoded.slice(0, sep);
  const password = decoded.slice(sep + 1);

  // Compare each field independently so a wrong username can't be distinguished
  // from a wrong password by response timing.
  const userOk = timingSafeEqual(user, expectedUser);
  const passwordOk = timingSafeEqual(password, expectedPassword);
  if (!userOk || !passwordOk) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
