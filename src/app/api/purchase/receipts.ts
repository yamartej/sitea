import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export type PurchaseOrderRecord = {
  id: number;
  company_id: number | null;
  supplier_id: number;
  tracking_number: string | null;
};

export type PurchaseOrderLineRecord = {
  id: number;
  purchase_order_id: number;
  product_id: number;
  quantity: number;
  price: number;
};

export type PurchaseReceiptLineRecord = {
  id: number;
  purchase_order_product_id: number;
  product_id: number;
  quantity: number;
};

export type PurchaseReceiptRecord = {
  id: number;
  purchase_order_id: number;
  warehouse_id: number;
  received_at: string;
  idempotency_key: string | null;
  lines: PurchaseReceiptLineRecord[];
};

export type ReceivingWarehouse = { id: number; name: string; company_id: number };
export type ReceivingProduct = { id: number; name: string };

const auth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export async function listReceivingData(token: string, companyId: number) {
  const headers = auth(token).headers;
  const [orders, lines, warehouses, products] = await Promise.all([
    axios.get<PurchaseOrderRecord[]>(`${apiUrl}/purchaseorders`, {
      headers, params: { company_id: companyId },
    }),
    axios.get<PurchaseOrderLineRecord[]>(`${apiUrl}/purchaseorderproducts`, {
      headers, params: { company_id: companyId },
    }),
    axios.get<ReceivingWarehouse[]>(`${apiUrl}/warehouses/get-by-company/${companyId}`, {
      headers,
    }),
    axios.get<ReceivingProduct[]>(`${apiUrl}/products`, {
      headers, params: { company_id: companyId },
    }),
  ]);

  return {
    orders: orders.data.filter((order) => Number(order.company_id) === companyId),
    lines: lines.data,
    warehouses: warehouses.data,
    products: products.data,
  };
}

export async function listPurchaseReceipts(
  token: string,
  companyId: number,
  orderId: number,
): Promise<PurchaseReceiptRecord[]> {
  const response = await axios.get<PurchaseReceiptRecord[]>(
    `${apiUrl}/purchaseorders/${orderId}/receipts`,
    {
      ...auth(token),
      params: { company_id: companyId },
    },
  );
  return response.data;
}

export async function postPurchaseReceipt(
  token: string,
  companyId: number,
  orderId: number,
  warehouseId: number,
  key: string,
  lines: { purchase_order_product_id: number; quantity: number }[],
): Promise<PurchaseReceiptRecord> {
  const response = await axios.post<PurchaseReceiptRecord>(
    `${apiUrl}/purchaseorders/${orderId}/receive`,
    {
      company_id: companyId,
      warehouse_id: warehouseId,
      receipt_key: key,
      lines,
    },
    auth(token),
  );
  return response.data;
}
