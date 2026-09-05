import { NextResponse } from "next/server";

/**
 * Reject cross-site state-changing requests.
 *
 * Every mutating endpoint here is authenticated by a cookie, which the browser
 * attaches automatically — so without this check a page on another domain could
 * make a signed-in barista's browser POST to /api/points and award points to a
 * card of the attacker's choosing. The victim never sees it happen.
 *
 * Supabase's auth cookie is SameSite=Lax, which already blocks the classic
 * cross-site form POST, but that is one library's default protecting our
 * endpoints. An explicit check keeps the guarantee in this codebase where it can
 * be read and tested.
 *
 * The rule: if an Origin header is present it must match this deployment.
 * Browsers always send Origin on POST, so genuine CSRF is always caught. A
 * missing Origin means a non-browser client (curl, a server-to-server call),
 * which has no victim cookies to ride on in the first place.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: "forbidden", message: "Origen inválido." }, { status: 403 });
  }

  // `host` reflects the deployment's own hostname, including the port in dev.
  const selfHost = request.headers.get("host") ?? new URL(request.url).host;

  if (originHost !== selfHost) {
    return NextResponse.json(
      { error: "forbidden", message: "Solicitud rechazada por seguridad." },
      { status: 403 }
    );
  }

  return null;
}
