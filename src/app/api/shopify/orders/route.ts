import { NextResponse } from "next/server";
import type { Order } from "@/lib/types";

interface ShopifyLineItem {
  id: number;
  title: string;
  price: string;
  quantity: number;
}

interface ShopifyOrder {
  created_at: string;
  line_items: ShopifyLineItem[];
  total_shipping_price_set?: {
    shop_money?: { amount: string };
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { storeUrl, apiKey, apiSecret } = body;

  if (!storeUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Missing storeUrl, apiKey, or apiSecret" },
      { status: 400 }
    );
  }

  const cleanUrl = storeUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  const endpoint = `https://${cleanUrl}/admin/api/2024-01/orders.json?status=any&limit=250`;
  const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Shopify API error (${res.status}): ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const shopifyOrders: ShopifyOrder[] = data.orders || [];

    const mappedOrders: Order[] = [];

    for (const order of shopifyOrders) {
      const itemCount = order.line_items.length || 1;
      const orderShipping = parseFloat(
        order.total_shipping_price_set?.shop_money?.amount || "0"
      );
      const shippingPerItem = orderShipping / itemCount;
      const dateStr = new Date(order.created_at).toLocaleDateString();

      for (const item of order.line_items) {
        mappedOrders.push({
          id: item.id,
          productName: item.title,
          sellingPrice: parseFloat(item.price) * item.quantity,
          cost: 0,
          shippingCost: parseFloat(shippingPerItem.toFixed(2)),
          adSpend: 0,
          date: dateStr,
        });
      }
    }

    return NextResponse.json({ orders: mappedOrders });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to connect to Shopify: ${err}` },
      { status: 500 }
    );
  }
}
