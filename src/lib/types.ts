export interface Order {
  id: number;
  productName: string;
  sellingPrice: number;
  cost: number;
  shippingCost: number;
  adSpend: number;
  date: string;
  imageUrl?: string;
}

export interface ProductCostEntry {
  cost: number;
  adSpend: number;
}
