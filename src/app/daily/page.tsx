"use client";

import { useState, useEffect, useMemo } from "react";
import type { Order } from "@/lib/types";
import ProductThumb from "@/components/ProductThumb";

interface DaySummary {
  date: string;
  orders: Order[];
  totalOrders: number;
  revenue: number;
  costs: number;
  adSpend: number;
  profit: number;
  margin: number;
}

export default function DailyBreakdown() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("orders");
    if (saved) setOrders(JSON.parse(saved));
  }, []);

  const dailySummaries: DaySummary[] = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    for (const o of orders) {
      if (!grouped[o.date]) grouped[o.date] = [];
      grouped[o.date].push(o);
    }
    return Object.entries(grouped)
      .map(([date, dayOrders]) => {
        const revenue = dayOrders.reduce((s, o) => s + o.sellingPrice, 0);
        const costs = dayOrders.reduce((s, o) => s + o.cost + o.shippingCost, 0);
        const adSpend = dayOrders.reduce((s, o) => s + o.adSpend, 0);
        const profit = revenue - costs - adSpend;
        return {
          date,
          orders: dayOrders,
          totalOrders: dayOrders.length,
          revenue,
          costs,
          adSpend,
          profit,
          margin: revenue > 0 ? (profit / revenue) * 100 : 0,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  function toggle(date: string) {
    setExpandedDay(expandedDay === date ? null : date);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Daily Breakdown</h1>

      {dailySummaries.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-6">
          <p className="text-muted">No orders yet. Add or sync orders on the Dashboard first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dailySummaries.map((day) => (
            <div key={day.date} className="bg-card rounded-lg shadow overflow-hidden">
              {/* Day summary row */}
              <button
                onClick={() => toggle(day.date)}
                className="w-full text-left p-4 sm:p-5 cursor-pointer hover:bg-hover transition-colors"
              >
                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{day.date}</span>
                    <span className="text-xs text-muted">{day.totalOrders} order{day.totalOrders !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted">Revenue:</span>
                    <span className="text-right">${day.revenue.toFixed(2)}</span>
                    <span className="text-muted">Costs:</span>
                    <span className="text-right text-negative">${day.costs.toFixed(2)}</span>
                    <span className="text-muted">Ad Spend:</span>
                    <span className="text-right text-negative">${day.adSpend.toFixed(2)}</span>
                    <span className="text-muted">Profit:</span>
                    <span className={`text-right font-medium ${day.profit >= 0 ? "text-positive" : "text-negative"}`}>
                      ${day.profit.toFixed(2)} ({day.margin.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted text-center">
                    {expandedDay === day.date ? "Tap to collapse" : "Tap to expand"}
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:flex items-center gap-6">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 text-muted transition-transform ${expandedDay === day.date ? "rotate-90" : ""}`}
                    >
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{day.date}</span>
                  </div>
                  <span className="text-sm text-muted">{day.totalOrders} order{day.totalOrders !== 1 ? "s" : ""}</span>
                  <span className="text-sm">Rev: ${day.revenue.toFixed(2)}</span>
                  <span className="text-sm text-negative">Costs: ${day.costs.toFixed(2)}</span>
                  <span className="text-sm text-negative">Ads: ${day.adSpend.toFixed(2)}</span>
                  <span className={`text-sm font-medium ml-auto ${day.profit >= 0 ? "text-positive" : "text-negative"}`}>
                    ${day.profit.toFixed(2)} ({day.margin.toFixed(1)}%)
                  </span>
                </div>
              </button>

              {/* Expanded orders */}
              {expandedDay === day.date && (
                <div className="border-t border-border">
                  {/* Mobile card layout */}
                  <div className="sm:hidden divide-y divide-border">
                    {day.orders.map((order) => {
                      const orderCosts = order.cost + order.shippingCost + order.adSpend;
                      const orderProfit = order.sellingPrice - orderCosts;
                      const orderMargin = order.sellingPrice > 0 ? ((orderProfit / order.sellingPrice) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={order.id} className="px-4 py-3 bg-hover">
                          <div className="flex items-center gap-2 mb-1">
                            <ProductThumb src={order.imageUrl} name={order.productName} />
                            <p className="text-sm font-medium">{order.productName}</p>
                          </div>
                          <div className="flex justify-between text-xs text-muted">
                            <span>Revenue: ${order.sellingPrice.toFixed(2)}</span>
                            <span>Cost: ${order.cost.toFixed(2)}</span>
                            <span>Ship: ${order.shippingCost.toFixed(2)}</span>
                            <span>Ads: ${order.adSpend.toFixed(2)}</span>
                          </div>
                          <div className="mt-1 text-sm">
                            <span className={`font-medium ${orderProfit >= 0 ? "text-positive" : "text-negative"}`}>
                              Profit: ${orderProfit.toFixed(2)} ({orderMargin}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-thead">
                        <tr>
                          <th className="px-6 py-2 text-xs font-medium text-muted">Product</th>
                          <th className="px-6 py-2 text-xs font-medium text-muted">Revenue</th>
                          <th className="px-6 py-2 text-xs font-medium text-muted">Cost</th>
                          <th className="px-6 py-2 text-xs font-medium text-muted">Shipping</th>
                          <th className="px-6 py-2 text-xs font-medium text-muted">Ad Spend</th>
                          <th className="px-6 py-2 text-xs font-medium text-muted">Profit</th>
                          <th className="px-6 py-2 text-xs font-medium text-muted">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {day.orders.map((order) => {
                          const orderCosts = order.cost + order.shippingCost + order.adSpend;
                          const orderProfit = order.sellingPrice - orderCosts;
                          const orderMargin = order.sellingPrice > 0 ? ((orderProfit / order.sellingPrice) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={order.id} className="bg-hover">
                              <td className="px-6 py-3 text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <ProductThumb src={order.imageUrl} name={order.productName} />
                                  {order.productName}
                                </div>
                              </td>
                              <td className="px-6 py-3 text-sm">${order.sellingPrice.toFixed(2)}</td>
                              <td className="px-6 py-3 text-sm text-negative">${order.cost.toFixed(2)}</td>
                              <td className="px-6 py-3 text-sm text-negative">${order.shippingCost.toFixed(2)}</td>
                              <td className="px-6 py-3 text-sm text-negative">${order.adSpend.toFixed(2)}</td>
                              <td className={`px-6 py-3 text-sm font-medium ${orderProfit >= 0 ? "text-positive" : "text-negative"}`}>
                                ${orderProfit.toFixed(2)}
                              </td>
                              <td className={`px-6 py-3 text-sm ${orderProfit >= 0 ? "text-positive" : "text-negative"}`}>
                                {orderMargin}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
