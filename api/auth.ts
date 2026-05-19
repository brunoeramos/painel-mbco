import { SA } from "../constants";

let _tokenCache: { token: string | null; exp: number } = { token: null, exp: 0 };

export async function getAccessToken(): Promise<string> {
  if (_tokenCache.token && Date.now() < _tokenCache.exp - 60000) return _tokenCache.token!;
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: SA.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const b64u = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const enc = (s: object) => b64u(unescape(encodeURIComponent(JSON.stringify(s))));
  const head = enc({ alg: "RS256", typ: "JWT" });
  const body = enc(claim);
  const msg = `${head}.${body}`;
  const pemBody = SA.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(msg));
  const jwt = `${msg}.${b64u(String.fromCharCode(...new Uint8Array(sig)))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Auth error");
  _tokenCache = { token: data.access_token, exp: now * 1000 + 3600000 };
  return data.access_token;
}
