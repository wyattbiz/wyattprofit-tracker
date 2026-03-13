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
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Product Costs</h1>

      {/* Default Ad Spend */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">Default Ad Spend</h2>
        <p className="text-sm text-gray-500 mb-4">
          Applied to any order that doesn&apos;t have a product-specific ad spend set below.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={defaultAdSpend}
            onChange={(e) => setDefaultAdSpend(e.target.value)}
            className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
          <span className="text-sm text-gray-500">per order</span>
        </div>
      </div>

      {/* Product Cost Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <h2 className="text-xl font-semibold p-6 pb-4">
          Products ({uniqueProducts.length})
        </h2>
        {uniqueProducts.length === 0 ? (
          <p className="px-6 pb-6 text-gray-500">
            No products yet. Add or sync orders on the Dashboard first.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-medium text-gray-500">
                    Product
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-500">
                    Cost per Unit ($)
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-500">
                    Ad Spend per Order ($)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {uniqueProducts.map((product) => (
                  <tr key={product} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{product}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productCosts[product]?.cost || ""}
                        onChange={(e) => updateCost(product, "cost", e.target.value)}
                        className="w-28 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-28 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Default"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer"
        >
          Save &amp; Apply to Orders
        </button>
        {saved && (
          <span className="text-green-600 text-sm font-medium">
            Saved and applied!
          </span>
        )}
      </div>
    </main>
  );
}
