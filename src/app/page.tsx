"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Order, ProductCostEntry } from "@/lib/types";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { mode } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem("orders");
    if (saved) setOrders(JSON.parse(saved));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders, loaded]);
  const [productName, setProductName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [cost, setCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredOrders = useMemo(() => {
    if (!startDate && !endDate) return orders;
    return orders.filter((o) => {
      const t = new Date(o.date).getTime();
      if (startDate && t < new Date(startDate).getTime()) return false;
      if (endDate && t > new Date(endDate).getTime() + 86399999) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.sellingPrice, 0);
  const totalCosts = filteredOrders.reduce(
    (sum, o) => sum + o.cost + o.shippingCost + o.adSpend,
    0
  );
  const netProfit = totalRevenue - totalCosts;

  const dailyProfitData = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const o of filteredOrders) {
      const profit = o.sellingPrice - o.cost - o.shippingCost - o.adSpend;
      grouped[o.date] = (grouped[o.date] || 0) + profit;
    }
    return Object.entries(grouped)
      .map(([date, profit]) => ({ date, profit: parseFloat(profit.toFixed(2)) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredOrders]);

  const productAnalytics = useMemo(() => {
    const map: Record<string, { revenue: number; profit: number; count: number }> = {};
    for (const o of filteredOrders) {
      const costs = o.cost + o.shippingCost + o.adSpend;
      if (!map[o.productName]) map[o.productName] = { revenue: 0, profit: 0, count: 0 };
      map[o.productName].revenue += o.sellingPrice;
      map[o.productName].profit += o.sellingPrice - costs;
      map[o.productName].count += 1;
    }
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredOrders]);

  // Chart colors based on theme
  const chartLineColor = mode === "red" ? "#cc5555" : "#16a34a";
  const chartGridColor = mode === "red" ? "#331111" : mode === "dark" ? "#374151" : "#e5e7eb";
  const chartTickColor = mode === "red" ? "#883333" : mode === "dark" ? "#9ca3af" : "#6b7280";
  const chartTooltipBg = mode === "red" ? "#1a0505" : mode === "dark" ? "#1f2937" : "#ffffff";
  const chartTooltipText = mode === "red" ? "#cc4444" : mode === "dark" ? "#e2e8f0" : "#1e293b";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productName || !sellingPrice || !cost) return;

    const newOrder: Order = {
      id: Date.now(),
      productName,
      sellingPrice: parseFloat(sellingPrice),
      cost: parseFloat(cost),
      shippingCost: parseFloat(shippingCost) || 0,
      adSpend: parseFloat(adSpend) || 0,
      date: new Date().toLocaleDateString(),
    };

    setOrders([newOrder, ...orders]);
    setProductName("");
    setSellingPrice("");
    setCost("");
    setShippingCost("");
    setAdSpend("");
  }

  function deleteOrder(id: number) {
    setOrders(orders.filter((o) => o.id !== id));
  }

  async function syncOrders() {
    const storeUrl = localStorage.getItem("shopifyStoreUrl");
    const accessToken = localStorage.getItem("shopifyAccessToken");
    if (!storeUrl || !accessToken) {
      alert("Please connect your Shopify store in Settings first.");
      return;
    }
    setSyncing(true);
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

      const existingIds = new Set(orders.map((o) => o.id));
      const newOrders = (data.orders as Order[])
        .filter((o) => !existingIds.has(o.id))
        .map((o) => {
          const entry = savedCosts[o.productName];
          return {
            ...o,
            cost: entry?.cost ?? 0,
            adSpend: entry?.adSpend ?? defaultAd,
          };
        });
      if (newOrders.length === 0) {
        alert("No new orders to sync.");
        return;
      }
      setOrders([...newOrders, ...orders]);
      alert(`Synced ${newOrders.length} new order(s) from Shopify.`);
    } catch {
      alert("Failed to connect to sync endpoint.");
    } finally {
      setSyncing(false);
    }
  }

  function exportCSV() {
    const rows = [["Date", "Product", "Selling Price", "Cost", "Shipping", "Ad Spend", "Profit"]];
    for (const o of filteredOrders) {
      const profit = o.sellingPrice - o.cost - o.shippingCost - o.adSpend;
      rows.push([
        o.date,
        `"${o.productName.replace(/"/g, '""')}"`,
        o.sellingPrice.toFixed(2),
        o.cost.toFixed(2),
        o.shippingCost.toFixed(2),
        o.adSpend.toFixed(2),
        profit.toFixed(2),
      ]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Dropshipping Profit Tracker</h1>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={filteredOrders.length === 0}
            className="bg-btn-neutral text-white px-4 py-2 rounded-md hover:bg-btn-neutral-hover transition-colors font-medium disabled:opacity-50 cursor-pointer text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={syncOrders}
            disabled={syncing}
            className="bg-btn-success text-white px-4 py-2 rounded-md hover:bg-btn-success-hover transition-colors font-medium disabled:opacity-50 cursor-pointer text-sm"
          >
            {syncing ? "Syncing..." : "Sync Orders"}
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card rounded-lg shadow p-4 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-muted mb-1">
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-muted mb-1">
            To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-auto border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="text-sm text-link hover:text-link-hover cursor-pointer"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-card rounded-lg shadow p-6 border-l-4 border-link">
          <p className="text-sm text-muted uppercase font-medium">
            Total Revenue
          </p>
          <p className="text-2xl font-bold text-link">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-card rounded-lg shadow p-6 border-l-4 border-negative">
          <p className="text-sm text-muted uppercase font-medium">
            Total Costs
          </p>
          <p className="text-2xl font-bold text-negative">
            ${totalCosts.toFixed(2)}
          </p>
        </div>
        <div
          className={`bg-card rounded-lg shadow p-6 border-l-4 ${
            netProfit >= 0 ? "border-positive" : "border-negative"
          }`}
        >
          <p className="text-sm text-muted uppercase font-medium">
            Net Profit
          </p>
          <p
            className={`text-2xl font-bold ${
              netProfit >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            ${netProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Daily Profit Chart */}
      {dailyProfitData.length > 0 && (
        <div className="bg-card rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Daily Profit</h2>
          <div className="h-[200px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyProfitData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTickColor }} />
              <YAxis tick={{ fontSize: 11, fill: chartTickColor }} width={45} />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Profit"]}
                contentStyle={{ backgroundColor: chartTooltipBg, color: chartTooltipText, border: `1px solid ${chartGridColor}` }}
                labelStyle={{ color: chartTooltipText }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke={chartLineColor}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add Order Form */}
      <div className="bg-card rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Add New Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Phone Case"
              required
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Selling Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="29.99"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Product Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="8.50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Shipping ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="3.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Ad Spend ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                className="w-full border border-input-border bg-input text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="5.00"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-btn-primary text-white px-6 py-2 rounded-md hover:bg-btn-primary-hover transition-colors font-medium cursor-pointer"
          >
            Add Order
          </button>
        </form>
      </div>

      {/* Orders */}
      <div className="bg-card rounded-lg shadow overflow-hidden mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold p-4 sm:p-6 pb-3 sm:pb-4">
          Orders ({filteredOrders.length})
        </h2>
        {filteredOrders.length === 0 ? (
          <p className="px-4 sm:px-6 pb-4 sm:pb-6 text-muted">
            No orders yet. Add your first order above!
          </p>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="sm:hidden divide-y divide-border">
              {filteredOrders.map((order) => {
                const orderCosts = order.cost + order.shippingCost + order.adSpend;
                const orderProfit = order.sellingPrice - orderCosts;
                return (
                  <div key={order.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium">{order.productName}</p>
                        <p className="text-xs text-muted">{order.date}</p>
                      </div>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-xs text-negative hover:opacity-75 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Revenue: ${order.sellingPrice.toFixed(2)}</span>
                      <span className="text-negative">Costs: ${orderCosts.toFixed(2)}</span>
                      <span className={`font-medium ${orderProfit >= 0 ? "text-positive" : "text-negative"}`}>
                        ${orderProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-thead border-y border-border">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-muted">Date</th>
                    <th className="px-6 py-3 text-sm font-medium text-muted">Product</th>
                    <th className="px-6 py-3 text-sm font-medium text-muted">Revenue</th>
                    <th className="px-6 py-3 text-sm font-medium text-muted">Costs</th>
                    <th className="px-6 py-3 text-sm font-medium text-muted">Profit</th>
                    <th className="px-6 py-3 text-sm font-medium text-muted"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => {
                    const orderCosts = order.cost + order.shippingCost + order.adSpend;
                    const orderProfit = order.sellingPrice - orderCosts;
                    return (
                      <tr key={order.id} className="hover:bg-hover">
                        <td className="px-6 py-4 text-sm text-muted">{order.date}</td>
                        <td className="px-6 py-4 text-sm font-medium">{order.productName}</td>
                        <td className="px-6 py-4 text-sm">${order.sellingPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-negative">${orderCosts.toFixed(2)}</td>
                        <td className={`px-6 py-4 text-sm font-medium ${orderProfit >= 0 ? "text-positive" : "text-negative"}`}>
                          ${orderProfit.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-negative hover:opacity-75 cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Product Analytics */}
      {productAnalytics.length > 0 && (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <h2 className="text-lg sm:text-xl font-semibold p-4 sm:p-6 pb-3 sm:pb-4">
            Product Analytics
          </h2>
          {/* Mobile card layout */}
          <div className="sm:hidden divide-y divide-border">
            {productAnalytics.map((p) => (
              <div key={p.name} className="p-4">
                <p className="text-sm font-medium mb-1">{p.name}</p>
                <p className="text-xs text-muted mb-2">{p.count} order{p.count !== 1 ? "s" : ""}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Rev: ${p.revenue.toFixed(2)}</span>
                  <span className={`font-medium ${p.profit >= 0 ? "text-positive" : "text-negative"}`}>
                    Profit: ${p.profit.toFixed(2)}
                  </span>
                  <span className={`${p.profit >= 0 ? "text-positive" : "text-negative"}`}>
                    Avg: ${(p.profit / p.count).toFixed(2)}
                  </span>
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
                  <th className="px-6 py-3 text-sm font-medium text-muted">Orders</th>
                  <th className="px-6 py-3 text-sm font-medium text-muted">Revenue</th>
                  <th className="px-6 py-3 text-sm font-medium text-muted">Profit</th>
                  <th className="px-6 py-3 text-sm font-medium text-muted">Avg Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productAnalytics.map((p) => (
                  <tr key={p.name} className="hover:bg-hover">
                    <td className="px-6 py-4 text-sm font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-muted">{p.count}</td>
                    <td className="px-6 py-4 text-sm">${p.revenue.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${p.profit >= 0 ? "text-positive" : "text-negative"}`}>
                      ${p.profit.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${p.profit >= 0 ? "text-positive" : "text-negative"}`}>
                      ${(p.profit / p.count).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
