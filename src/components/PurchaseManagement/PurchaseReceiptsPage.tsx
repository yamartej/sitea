"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";
import {
  listReceivingData,
  listPurchaseReceipts,
  postPurchaseReceipt,
  PurchaseOrderRecord,
  PurchaseOrderLineRecord,
  PurchaseReceiptRecord,
  ReceivingProduct,
  ReceivingWarehouse,
} from "@/app/api/purchase/receipts";

const describeError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (error.response?.status === 403) return "No dispone de permisos para esta operación.";
    if (!error.response) return "Sin respuesta del servidor. Consulte el historial antes de reintentar.";
  }
  return "No se pudo completar la operación. Consulte el historial antes de reintentar.";
};

export default function PurchaseReceiptsPage() {
  const [token, setToken] = useState("");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [lines, setLines] = useState<PurchaseOrderLineRecord[]>([]);
  const [products, setProducts] = useState<ReceivingProduct[]>([]);
  const [warehouses, setWarehouses] = useState<ReceivingWarehouse[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [receipts, setReceipts] = useState<PurchaseReceiptRecord[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const pendingKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const session = await getSession();
        if (!session?.user?.token || !session.user.company_id) {
          throw new Error("Se requiere una sesión vinculada a una empresa.");
        }

        const resolvedCompany = Number(session.user.company_id);
        if (!Number.isInteger(resolvedCompany) || resolvedCompany <= 0) {
          throw new Error("La empresa de la sesión no es válida.");
        }

        const data = await listReceivingData(session.user.token, resolvedCompany);
        if (!active) return;

        setToken(session.user.token);
        setCompanyId(resolvedCompany);
        setOrders(data.orders);
        setLines(data.lines);
        setWarehouses(data.warehouses);
        setProducts(data.products);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error && !axios.isAxiosError(cause)
            ? cause.message : describeError(cause));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  const selectedOrder = orders.find((order) => order.id === orderId);
  const orderLines = lines.filter((line) => line.purchase_order_id === orderId);
  const historicComplete = receipts.some((receipt) => receipt.lines.length === 0);

  const remaining = (line: PurchaseOrderLineRecord): number => {
    if (historicComplete) return 0;
    const received = receipts.reduce(
      (total, receipt) => total +
        receipt.lines
          .filter((item) => item.purchase_order_product_id === line.id)
          .reduce((sum, item) => sum + Number(item.quantity), 0),
      0,
    );
    return Math.max(0, Number(line.quantity) - received);
  };

  const selectOrder = async (id: number) => {
    setOrderId(id);
    setReceipts([]);
    setQuantities({});
    setError("");
    setSuccess("");
    pendingKey.current = null;
    if (!companyId || !token) return;

    setLoading(true);
    try {
      setReceipts(await listPurchaseReceipts(token, companyId, id));
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setLoading(false);
    }
  };

  const refreshReceipts = async () => {
    if (!companyId || !token || !orderId) return;
    setLoading(true);
    try {
      setReceipts(await listPurchaseReceipts(token, companyId, orderId));
      setError("");
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId || !token || !orderId || !warehouseId || busy || loading) return;

    const selected = orderLines
      .map((line) => ({
        purchase_order_product_id: line.id,
        quantity: Number(quantities[line.id] || 0),
        maximum: remaining(line),
      }))
      .filter((item) => item.quantity > 0);

    if (!selected.length || selected.some((item) =>
      !Number.isInteger(item.quantity) || item.quantity > item.maximum)) {
      setError("Indique cantidades enteras positivas que no superen el saldo pendiente.");
      return;
    }

    if (pendingKey.current === null) {
      pendingKey.current = crypto.randomUUID();
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const posted = await postPurchaseReceipt(
        token,
        companyId,
        orderId,
        Number(warehouseId),
        pendingKey.current,
        selected.map(({ purchase_order_product_id, quantity }) =>
          ({ purchase_order_product_id, quantity })),
      );

      setReceipts(await listPurchaseReceipts(token, companyId, orderId));
      pendingKey.current = null;
      setQuantities({});
      setSuccess(`Recepción #${posted.id} registrada con éxito en Kardex.`);
    } catch (cause) {
      setError(describeError(cause) +
        " Si el servidor perdió la conexión, verifique el historial antes de generar otra recepción.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto p-5 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Recepción de órdenes de compra</h1>
        <p className="text-sm text-gray-600">
          Registrar entregas completas o parciales, con control de pendientes y trazabilidad de Kardex.
        </p>
      </div>

      {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-red-800 rounded">{error}</p>}
      {success && <p role="status" className="border border-green-300 bg-green-50 p-3 text-green-800 rounded">{success}</p>}
      {loading && <p role="status">Cargando datos...</p>}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Orden de compra
          <select
            className="block w-full border rounded p-2 mt-1"
            value={orderId ?? ""}
            disabled={busy || !token}
            onChange={(event) => {
              const value = event.target.value;
              if (value) void selectOrder(Number(value));
              else {
                setOrderId(null);
                setReceipts([]);
                setQuantities({});
                pendingKey.current = null;
              }
            }}
          >
            <option value="">Seleccione una orden</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                #{order.id} — {order.tracking_number || "Sin seguimiento"}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Almacén que recibe
          <select
            className="block w-full border rounded p-2 mt-1"
            value={warehouseId}
            disabled={busy || !token}
            onChange={(event) => setWarehouseId(event.target.value)}
          >
            <option value="">Seleccione un almacén</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </label>
      </div>

      {selectedOrder && (
        <form onSubmit={submit} className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between gap-3 items-center">
            <h2 className="font-semibold">Renglones de la orden #{selectedOrder.id}</h2>
            <button type="button" onClick={() => void refreshReceipts()}
              disabled={busy || loading}
              className="text-sm underline text-blue-700 disabled:opacity-50">
              Actualizar historial
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b">
                <th className="p-2">Producto</th>
                <th className="p-2">Pedido</th>
                <th className="p-2">Pendiente</th>
                <th className="p-2">Recibir ahora</th>
              </tr></thead>
              <tbody>
                {orderLines.map((line) => (
                  <tr key={line.id} className="border-b">
                    <td className="p-2">
                      {products.find((product) => product.id === line.product_id)?.name || `Producto #${line.product_id}`}
                    </td>
                    <td className="p-2">{line.quantity}</td>
                    <td className="p-2">{remaining(line)}</td>
                    <td className="p-2">
                      <input
                        aria-label={`Cantidad a recibir para producto ${line.product_id}`}
                        type="number" min="0" max={remaining(line)} step="1"
                        className="border rounded p-2 w-28"
                        value={quantities[line.id] || ""}
                        disabled={busy || loading || remaining(line) === 0 || Boolean(pendingKey.current)}
                        onChange={(event) => setQuantities((prev) =>
                          ({ ...prev, [line.id]: event.target.value }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orderLines.length === 0 && <p className="p-3 text-gray-600">Esta orden no tiene renglones visibles.</p>}
          </div>
          <button type="submit"
            disabled={busy || loading || !warehouseId || historicComplete || !orderLines.some((line) => remaining(line) > 0)}
            className="bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-40">
            {busy ? "Registrando..." : "Registrar recepción"}
          </button>
          <p className="text-xs text-gray-600">
            El registro actualiza inventario y Kardex. Cada recepción conserva sus cantidades y su clave de reintento.
          </p>
        </form>
      )}

      {selectedOrder && (
        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Historial de recepciones</h2>
          {receipts.length === 0 ? (
            <p className="text-sm text-gray-600">No hay recepciones registradas.</p>
          ) : receipts.map((receipt) => (
            <div key={receipt.id} className="border-t py-2 text-sm">
              <strong>#{receipt.id}</strong> — {new Date(receipt.received_at).toLocaleString()}
              <span className="ml-2">
                {receipt.lines.length === 0
                  ? "Recepción histórica completa (sin detalle de renglones)"
                  : `${receipt.lines.length} renglón(es)`}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
