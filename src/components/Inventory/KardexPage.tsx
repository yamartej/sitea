"use client";

import axios from "axios";
import { getSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

type Movement = {
  id: number;
  created_at: string;
  type: string;
  quantity_delta: number;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  product_id: number;
  warehouse_id: number;
  product?: { id: number; name: string } | null;
  warehouse?: { id: number; name: string } | null;
  user?: { id: number; name: string } | null;
};

type PageResult = {
  current_page: number;
  last_page: number;
  total: number;
  data: Movement[];
};

const types: Record<string, string> = {
  opening: "Apertura",
  receive: "Entrada",
  issue: "Salida",
  adjustment: "Ajuste",
  transfer_in: "Transferencia entrante",
  transfer_out: "Transferencia saliente",
};

export default function KardexPage() {
  const [token, setToken] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<Movement[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [kind, setKind] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const session = await getSession();
      if (!active) return;
      if (!session?.user?.token || !session?.user?.company_id) {
        setError("Es necesario iniciar sesión con una empresa asignada.");
        setBusy(false);
        return;
      }
      setToken(session.user.token);
      setCompanyId(String(session.user.company_id));
    };
    void init();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!token || !companyId) return;
    let active = true;
    const load = async () => {
      setBusy(true);
      try {
        const response = await axios.get<PageResult>(
          `${process.env.NEXT_PUBLIC_URL_API}/inventory/kardex`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              company_id: companyId,
              page,
              per_page: 25,
              product_id: productId || undefined,
              warehouse_id: warehouseId || undefined,
              type: kind || undefined,
            },
          },
        );
        if (active) {
          setRows(response.data.data);
          setPage(response.data.current_page);
          setLastPage(response.data.last_page);
          setTotal(response.data.total);
          setError("");
        }
      } catch (cause) {
        if (active) {
          setError(axios.isAxiosError(cause) && cause.response?.status === 403
            ? "No tiene permiso para consultar el Kardex."
            : "No se pudo consultar Kardex. Verifique la API.");
        }
      } finally {
        if (active) setBusy(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, companyId, page, productId, warehouseId, kind]);

  return (
    <section className="p-5 max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kardex de inventario</h1>
        <p className="text-sm text-gray-600">
          Movimientos inmutables por empresa, producto y almacén. Los saldos son históricos.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Producto (ID)
          <input type="number" min="1" value={productId}
            className="block border rounded p-2 w-full"
            onChange={(e) => { setProductId(e.target.value); setPage(1); }} />
        </label>
        <label className="text-sm">Almacén (ID)
          <input type="number" min="1" value={warehouseId}
            className="block border rounded p-2 w-full"
            onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }} />
        </label>
        <label className="text-sm">Tipo de movimiento
          <select className="block border rounded p-2 w-full" value={kind}
            onChange={(e) => { setKind(e.target.value); setPage(1); }}>
            <option value="">Todos</option>
            {Object.entries(types).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="p-3 border border-red-300 rounded text-red-700">{error}</p>}
      {busy && <p role="status">Consultando movimientos...</p>}
      <p className="text-sm text-gray-600">Total de movimientos: {total}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="border-y">
            <tr>
              <th className="p-2">Fecha</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Producto</th>
              <th className="p-2">Almacén</th>
              <th className="p-2">Variación</th>
              <th className="p-2">Antes</th>
              <th className="p-2">Después</th>
              <th className="p-2">Referencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((movement) => (
              <tr key={movement.id} className="border-b">
                <td className="p-2 whitespace-nowrap">{new Date(movement.created_at).toLocaleString()}</td>
                <td className="p-2">{types[movement.type] || movement.type}</td>
                <td className="p-2">{movement.product?.name || movement.product_id}</td>
                <td className="p-2">{movement.warehouse?.name || movement.warehouse_id}</td>
                <td className="p-2 font-medium">{movement.quantity_delta > 0 ? "+" : ""}{movement.quantity_delta}</td>
                <td className="p-2">{movement.balance_before}</td>
                <td className="p-2">{movement.balance_after}</td>
                <td className="p-2">{movement.reference_type || "—"} {movement.reference_id ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!busy && rows.length === 0 && <p className="p-4 text-sm">Sin movimientos para estos filtros.</p>}
      </div>
      <div className="flex items-center gap-3 justify-end text-sm">
        <button type="button" className="px-3 py-2 border rounded disabled:opacity-50"
          disabled={busy || page <= 1} onClick={() => setPage(page - 1)}>
          Anterior
        </button>
        <span>Página {page} de {Math.max(lastPage, 1)}</span>
        <button type="button" className="px-3 py-2 border rounded disabled:opacity-50"
          disabled={busy || page >= lastPage} onClick={() => setPage(page + 1)}>
          Siguiente
        </button>
      </div>
    </section>
  );
}
