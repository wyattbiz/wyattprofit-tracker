import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { clientId, clientSecret, storeName } = await request.json();

  if (!clientId || !clientSecret || !storeName) {
    return NextResponse.json(
      { error: "Missing clientId, clientSecret, or storeName" },
      { status: 400 }
    );
  }

  const cleanStore = storeName
    .replace(/^https?:\/\//, "")
    .replace(/\.myshopify\.com.*$/, "")
    .replace(/\/+$/, "");

  const nonce = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set("shopify_client_id", clientId, { path: "/", maxAge: 600 });
  cookieStore.set("shopify_client_secret", clientSecret, {
    path: "/",
    maxAge: 600,
    httpOnly: true,
  });
  cookieStore.set("shopify_nonce", nonce, { path: "/", maxAge: 600 });
  cookieStore.set("shopify_store", cleanStore, { path: "/", maxAge: 600 });

  const redirectUri = "http://localhost:3000/api/shopify/callback";
  const scopes = "read_orders";

  const authUrl =
    `https://${cleanStore}.myshopify.com/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(nonce)}`;

  return NextResponse.json({ authUrl });
}
