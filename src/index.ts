// src/index.ts

/**
 * Cloudflare Worker that reads the "accessToken" cookie from the incoming request.
 * If the cookie exists, redirects to https://{host}/desktop-redirect?token={accessToken}.
 * Otherwise, redirects to https://{host}.
 */

export default {
  async fetch(request: Request): Promise<Response> {
    // Extract the Host header to determine the target domain.
    const host = request.headers.get('host');
    if (!host) {
      // If the Host header is missing, return a 400 Bad Request.
      return new Response('Bad Request: Missing Host header', { status: 400 });
    }

    // Helper function to parse cookies into a key/value object.
    function parseCookies(cookieHeader: string): Record<string, string> {
      const cookies: Record<string, string> = {};
      // Split individual cookies by ';'
      const pairs = cookieHeader.split(';');
      for (const pair of pairs) {
        const [rawName, rawValue] = pair.split('=');
        if (!rawName || rawValue === undefined) continue;
        const name = rawName.trim();
        const value = rawValue.trim();
        cookies[name] = value;
      }
      return cookies;
    }

    // Retrieve the Cookie header.
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);

    // Look for the "accessToken" cookie.
    const accessToken = cookies['accessToken'];

    // Construct the redirect URL based on whether the token exists.
    let redirectUrl: string;
    if (accessToken) {
      // Encode the token to ensure special characters are handled.
      const encodedToken = encodeURIComponent(accessToken);
      redirectUrl = `https://${host}/desktop-redirect?token=${encodedToken}`;
    } else {
      redirectUrl = `https://${host}`;
    }

    // Perform a 302 redirect to the target URL.
    return Response.redirect(redirectUrl, 302);
  },
};
