"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Order, ProductCostEntry } from "@/lib/types";

export default function Settings() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 text-muted">Loading...</div>}>
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
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => {
    setClientId(localStorage.getItem("shopifyClientId") || "");
    setClientSecret(localStorage.getItem("shopifyClientSecret") || "");
    setStoreName(localStorage.getItem("shopifyStoreName") || "");

    const existingToken = localStorage.getItem("shopifyAccessToken");
    const existingShop = localStorage.getItem("shopifyStoreUrl");
    if (existingToken && existingShop) {
      setConnected(true);
      setConnectedShop(existingShop);

      // One-time auto re-sync to fix duplicate orders and add source tags
      if (localStorage.getItem("resyncVersion") !== "3") {
        localStorage.setItem("resyncVersion", "3");
        handleResync(true);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleResync(auto = false) {
    const storeUrl = localStorage.getItem("shopifyStoreUrl");
    const accessToken = localStorage.getItem("shopifyAccessToken");
    if (!storeUrl || !accessToken) {
      if (!auto) alert("Please connect your Shopify store first.");
      return;
    }
    if (!auto && !confirm("This will remove all Shopify orders and re-import them fresh. Manually added orders will be kept. Continue?")) {
      return;
    }
    setResyncing(true);
    try {
      const res = await fetch("/api/shopify/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl, accessToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to sync orders");
        return;
      }

      const savedCosts: Record<string, ProductCostEntry> = JSON.parse(
        localStorage.getItem("productCosts") || "{}"
      );
      const defaultAd = parseFloat(localStorage.getItem("defaultAdSpend") || "0") || 0;

      const shopifyOrders: Order[] = (data.orders as Order[]).map((o) => {
        const entry = savedCosts[o.productName];
        return {
          ...o,
          cost: entry?.cost ?? 0,
          adSpend: entry?.adSpend ?? defaultAd,
        };
      });

      // Keep only manually added orders, replace all Shopify orders
      const existingOrders: Order[] = JSON.parse(localStorage.getItem("orders") || "[]");
      const manualOrders = existingOrders.filter((o) => o.source !== "shopify");

      const allOrders = [...shopifyOrders, ...manualOrders];
      localStorage.setItem("orders", JSON.stringify(allOrders));
      alert(`Re-synced ${shopifyOrders.length} order(s) from Shopify. ${manualOrders.length} manual order(s) kept.`);
    } catch {
      alert("Failed to connect to sync endpoint.");
    } finally {
      setResyncing(false);
    }
  }

  function handleDisconnect() {
    localStorage.removeItem("shopifyAccessToken");
    localStorage.removeItem("shopifyStoreUrl");
    setConnected(false);
    setConnectedShop("");
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Settings</h1>

      {connected && (
        <div className="bg-success-bg border border-success-border rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-success-text font-medium">Connected to Shopify</p>
            <p className="text-success-sub text-sm">{connectedShop}</p>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-negative hover:opacity-75 cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      )}

      <div className="bg-card rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Shopify Integration</h2>
        <p className="text-sm text-muted mb-4">
          Create a custom app in your Shopify admin under Settings &gt; Apps and
          sales channels &gt; Develop apps. Copy the Client ID and Client Secret,
          and set the allowed redirect URL to:{" "}
          <code className="bg-code-bg px-1 rounded text-xs">
            https://wyattprofit-tracker.vercel.app/api/shopify/callback
          </code>
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your Shopify app Client ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your Shopify app Client Secret"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Store Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="flex-1 border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="my-store"
              />
              <span className="text-sm text-muted">.myshopify.com</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-btn-primary text-white px-6 py-2 rounded-md hover:bg-btn-primary-hover transition-colors font-medium cursor-pointer"
            >
              Save
            </button>
            {saved && (
              <span className="text-positive text-sm font-medium">
                Saved!
              </span>
            )}
          </div>
        </form>

        <hr className="my-6 border-border" />

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleConnect}
            disabled={connecting || connected}
            className="bg-btn-success text-white px-6 py-2 rounded-md hover:bg-btn-success-hover transition-colors font-medium disabled:opacity-50 cursor-pointer"
          >
            {connecting
              ? "Redirecting..."
              : connected
              ? "Connected"
              : "Connect to Shopify"}
          </button>
          {connected && (
            <button
              onClick={() => handleResync()}
              disabled={resyncing}
              className="bg-btn-neutral text-white px-6 py-2 rounded-md hover:bg-btn-neutral-hover transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              {resyncing ? "Re-syncing..." : "Re-sync All Orders"}
            </button>
          )}
        </div>
        {connected && (
          <p className="text-xs text-muted mt-3">
            Re-sync removes all Shopify orders and re-imports them fresh with image data. Manually added orders are kept.
          </p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-lg shadow p-4 sm:p-6 mt-6 border border-negative/30">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 text-negative">Danger Zone</h2>
        <p className="text-sm text-muted mb-4">
          This will permanently delete all orders (both Shopify and manually added) and reset the dashboard to zero.
        </p>
        <button
          onClick={() => {
            if (!confirm("Are you sure you want to delete ALL orders? This cannot be undone.")) return;
            localStorage.removeItem("orders");
            alert("All orders have been deleted.");
          }}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium cursor-pointer"
        >
          Delete All Orders
        </button>
      </div>
    </main>
  );
}
