"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Settings() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [storeName, setStoreName] = useState("");
  const [saved, setSaved] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setClientId(localStorage.getItem("shopifyClientId") || "");
    setClientSecret(localStorage.getItem("shopifyClientSecret") || "");
    setStoreName(localStorage.getItem("shopifyStoreName") || "");

    const existingToken = localStorage.getItem("shopifyAccessToken");
    const existingShop = localStorage.getItem("shopifyStoreUrl");
    if (existingToken && existingShop) {
      setConnected(true);
      setConnectedShop(existingShop);
    }

    // Handle OAuth callback redirect
    const token = searchParams.get("token");
    const shop = searchParams.get("shop");
    if (token && shop) {
      localStorage.setItem("shopifyAccessToken", token);
      localStorage.setItem("shopifyStoreUrl", shop);
      setConnected(true);
      setConnectedShop(shop);
      router.replace("/settings");
    }
  }, [searchParams, router]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("shopifyClientId", clientId);
    localStorage.setItem("shopifyClientSecret", clientSecret);
    localStorage.setItem("shopifyStoreName", storeName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleConnect() {
    if (!clientId || !clientSecret || !storeName) {
      alert("Please fill in all fields and save before connecting.");
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch("/api/shopify/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, storeName }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start OAuth flow.");
        return;
      }
      window.location.href = data.authUrl;
    } catch {
      alert("Failed to connect. Please check your credentials.");
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    localStorage.removeItem("shopifyAccessToken");
    localStorage.removeItem("shopifyStoreUrl");
    setConnected(false);
    setConnectedShop("");
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {connected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-green-800 font-medium">Connected to Shopify</p>
            <p className="text-green-700 text-sm">{connectedShop}</p>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-red-600 hover:text-red-800 cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Shopify Integration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Create a custom app in your Shopify admin under Settings &gt; Apps and
          sales channels &gt; Develop apps. Copy the Client ID and Client Secret,
          and set the allowed redirect URL to:{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">
            https://wyattprofit-tracker.vercel.app/api/shopify/callback
          </code>
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Shopify app Client ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Shopify app Client Secret"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-store"
              />
              <span className="text-sm text-gray-500">.myshopify.com</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer"
            >
              Save
            </button>
            {saved && (
              <span className="text-green-600 text-sm font-medium">
                Saved!
              </span>
            )}
          </div>
        </form>

        <hr className="my-6 border-gray-200" />

        <button
          onClick={handleConnect}
          disabled={connecting || connected}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 cursor-pointer"
        >
          {connecting
            ? "Redirecting..."
            : connected
            ? "Connected"
            : "Connect to Shopify"}
        </button>
      </div>
    </main>
  );
}
