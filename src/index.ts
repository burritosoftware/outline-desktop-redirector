// src/index.ts

export interface Env {
  OUTLINE_HOST: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Helper to parse cookies from the "Cookie" header
    function getCookie(cookieHeader: string | null, name: string): string | null {
      if (!cookieHeader) return null;
      const cookies = cookieHeader.split(";").map(c => c.trim().split("="));
      for (const [key, ...rest] of cookies) {
        if (key === name) {
          return rest.join("=");
        }
      }
      return null;
    }

    // Attempt to read the Outline host from KV. If missing, initialize it to the default.
    let outlineHost = await env.OUTLINE_HOST.get("host");
    if (!outlineHost) {
      outlineHost = "app.getoutline.com";
      // Store the default value so that subsequent requests see it in KV
      await env.OUTLINE_HOST.put("host", outlineHost);
    }

    const url = new URL(request.url);
    const requestHost = url.hostname;
    const requestPath = url.pathname;
    const cookieHeader = request.headers.get("Cookie");

    // If the request is already on the Outline host...
    if (requestHost === outlineHost) {
      // Only intercept the "/desktop-login" path
      if (requestPath === "/desktop-login") {
        const accessToken = getCookie(cookieHeader, "accessToken");

        if (accessToken) {
          // Redirect to /desktop-redirect?token={accessToken}
          const redirectUrl = `https://${outlineHost}/desktop-redirect?token=${encodeURIComponent(accessToken)}`;
          return Response.redirect(redirectUrl, 302);
        } else {
          // No accessToken cookie: redirect to the Outline host root
          const fallbackUrl = `https://${outlineHost}`;
          return Response.redirect(fallbackUrl, 302);
        }
      }

      // On Outline host but not "/desktop-login" → let it pass through
      return fetch(request);
    }

    // If NOT on the Outline host, redirect to Outline host + "/desktop-login"
    const loginUrl = `https://${outlineHost}/desktop-login`;
    return Response.redirect(loginUrl, 302);
  },
};
