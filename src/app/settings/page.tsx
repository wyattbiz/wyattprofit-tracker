"use client";

import { useState, useEffect } from "react";

export default function Settings() {
  const [storeUrl, setStoreUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStoreUrl(localStorage.getItem("shopifyStoreUrl") || "");
    setApiKey(localStorage.getItem("shopifyApiKey") || "");
    setApiSecret(localStorage.getItem("shopifyApiSecret") || "");
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("shopifyStoreUrl", storeUrl);
    localStorage.setItem("shopifyApiKey", apiKey);
    localStorage.setItem("shopifyApiSecret", apiSecret);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Shopify Integration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect your Shopify store to sync orders. Create a custom app in
          your Shopify admin under Settings &gt; Apps and sales channels &gt;
          Develop apps. Use the API Key as your username and API Secret as your
          password for basic HTTP authentication.
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store URL
            </label>
            <input
              type="text"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my-store.myshopify.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Shopify app API Key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Shopify app API Secret"
            />
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
      </div>
    </main>
  );
}
