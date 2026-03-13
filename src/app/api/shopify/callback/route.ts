import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const shop = url.searchParams.get("shop");

  if (!code || !state || !shop) {
    return NextResponse.json(
      { error: "Missing code, state, or shop parameter" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const savedNonce = cookieStore.get("shopify_nonce")?.value;
  const clientId = cookieStore.get("shopify_client_id")?.value;
  const clientSecret = cookieStore.get("shopify_client_secret")?.value;

  if (!savedNonce || state !== savedNonce) {
    return NextResponse.json(
      { error: "Invalid state parameter. Possible CSRF attack." },
      { status: 403 }
    );
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "OAuth session expired. Please try connecting again." },
      { status: 400 }
    );
  }

  try {
    const tokenRes = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return NextResponse.json(
        { error: `Shopify token exchange failed: ${text}` },
        { status: tokenRes.status }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Clean up OAuth cookies
    cookieStore.delete("shopify_client_id");
    cookieStore.delete("shopify_client_secret");
    cookieStore.delete("shopify_nonce");
    cookieStore.delete("shopify_store");

    // Redirect to settings with token so the client can save to localStorage
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("shop", shop);
    redirectUrl.searchParams.set("token", accessToken);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to exchange code for token: ${err}` },
      { status: 500 }
    );
  }
}
