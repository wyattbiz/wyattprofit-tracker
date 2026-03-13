import { NextResponse } from "next/server";
import type { Order } from "@/lib/types";

interface ShopifyLineItem {
  id: number;
  title: string;
  price: string;
  quantity: number;
  product_id?: number | null;
}

interface ShopifyOrder {
  created_at: string;
  line_items: ShopifyLineItem[];
  total_shipping_price_set?: {
    shop_money?: { amount: string };
  };
}

interface ShopifyImage {
  src: string;
}

async function fetchProductImage(
  cleanUrl: string,
  accessToken: string,
  productId: number,
  cache: Map<number, string | undefined>
): Promise<string | undefined> {
  if (cache.has(productId)) return cache.get(productId);

  try {
    const res = await fetch(
      `https://${cleanUrl}/admin/api/2024-01/products/${productId}/images.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const images: ShopifyImage[] = data.images || [];
      const src = images[0]?.src || undefined;
      cache.set(productId, src);
      return src;
    }
  } catch {
    // Silently fail for image fetch
  }
  cache.set(productId, undefined);
  return undefined;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { storeUrl, accessToken } = body;

  if (!storeUrl || !accessToken) {
    return NextResponse.json(
      { error: "Missing storeUrl or accessToken" },
      { status: 400 }
    );
  }

  const cleanUrl = storeUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  const endpoint = `https://${cleanUrl}/admin/api/2024-01/orders.json?status=any&limit=250`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
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

    // Collect unique product IDs
    const productIds = new Set<number>();
    for (const order of shopifyOrders) {
      for (const item of order.line_items) {
        if (item.product_id) productIds.add(item.product_id);
      }
    }

    // Fetch all product images in parallel, cached by product_id
    const imageCache = new Map<number, string | undefined>();
    const imageFetches = Array.from(productIds).map((pid) =>
      fetchProductImage(cleanUrl, accessToken, pid, imageCache)
    );
    await Promise.all(imageFetches);

    // Map orders
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
          imageUrl: item.product_id ? imageCache.get(item.product_id) : undefined,
          source: "shopify",
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
