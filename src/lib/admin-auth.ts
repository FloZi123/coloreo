export const ADMIN_COOKIE = "coloreo_admin";

/** Token = SHA-256(ADMIN_PASSWORD). Wird als httpOnly-Cookie gesetzt und im Proxy geprüft. */
export async function expectedToken(): Promise<string | null> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw + "::coloreo"));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function checkPassword(input: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && input === pw;
}
