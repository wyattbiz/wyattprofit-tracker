"use client";

import { useState, useEffect } from "react";
import type { Order, ProductCostEntry } from "@/lib/types";

export default function ProductCosts() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCosts, setProductCosts] = useState<Record<string, ProductCostEntry>>({});
  const [defaultAdSpend, setDefaultAdSpend] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    const savedCosts = localStorage.getItem("productCosts");
    if (savedCosts) setProductCosts(JSON.parse(savedCosts));

    const savedDefault = localStorage.getItem("defaultAdSpend");
    if (savedDefault) setDefaultAdSpend(savedDefault);
  }, []);

  const uniqueProducts = Array.from(
    new Set(orders.map((o) => o.productName))
  ).sort();

  function updateCost(product: string, field: "cost" | "adSpend", value: string) {
    setProductCosts((prev) => ({
      ...prev,
      [product]: {
        cost: prev[product]?.cost ?? 0,
        adSpend: prev[product]?.adSpend ?? 0,
        [field]: parseFloat(value) || 0,
      },
    }));
  }

  function handleSave() {
    localStorage.setItem("productCosts", JSON.stringify(productCosts));
    localStorage.setItem("defaultAdSpend", defaultAdSpend);

    // Apply costs to existing orders
    const updatedOrders = orders.map((order) => {
      const entry = productCosts[order.productName];
      return {
        ...order,
        cost: entry?.cost ?? order.cost,
        adSpend: entry?.adSpend ?? (parseFloat(defaultAdSpend) || order.adSpend),
      };
    });
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Product Costs</h1>

      {/* Default Ad Spend */}
      <div className="bg-card rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl font-semibold mb-2">Default Ad Spend</h2>
        <p className="text-sm text-muted mb-4">
          Applied to any order that doesn&apos;t have a product-specific ad spend set below.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={defaultAdSpend}
            onChange={(e) => setDefaultAdSpend(e.target.value)}
            className="w-32 border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0.00"
          />
          <span className="text-sm text-muted">per order</span>
        </div>
      </div>

      {/* Product Cost Table */}
      <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
        <h2 className="text-lg sm:text-xl font-semibold p-4 sm:p-6 pb-3 sm:pb-4">
          Products ({uniqueProducts.length})
        </h2>
        {uniqueProducts.length === 0 ? (
          <p className="px-4 sm:px-6 pb-4 sm:pb-6 text-muted">
            No products yet. Add or sync orders on the Dashboard first.
          </p>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="sm:hidden divide-y divide-border">
              {uniqueProducts.map((product) => (
                <div key={product} className="p-4 space-y-3">
                  <p className="text-sm font-medium">{product}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Cost per Unit ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productCosts[product]?.cost || ""}
                        onChange={(e) => updateCost(product, "cost", e.target.value)}
                        className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Ad Spend ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productCosts[product]?.adSpend || ""}
                        onChange={(e) => updateCost(product, "adSpend", e.target.value)}
                        className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Default"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-thead border-y border-border">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-muted">Product</th>
                    <th className="px-6 py-3 text-sm font-medium text-muted">Cost per Unit ($)</th>
                    <th className="px-6 py-3 text-sm font-medium text-muted">Ad Spend per Order ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {uniqueProducts.map((product) => (
                    <tr key={product} className="hover:bg-hover">
                      <td className="px-6 py-4 text-sm font-medium">{product}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productCosts[product]?.cost || ""}
                          onChange={(e) => updateCost(product, "cost", e.target.value)}
                          className="w-28 border border-input-border bg-input text-foreground rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productCosts[product]?.adSpend || ""}
                          onChange={(e) => updateCost(product, "adSpend", e.target.value)}
                          className="w-28 border border-input-border bg-input text-foreground rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Default"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="bg-btn-primary text-white px-6 py-2 rounded-md hover:bg-btn-primary-hover transition-colors font-medium cursor-pointer"
        >
          Save &amp; Apply to Orders
        </button>
        {saved && (
          <span className="text-positive text-sm font-medium">
            Saved and applied!
          </span>
        )}
      </div>
    </main>
  );
}
