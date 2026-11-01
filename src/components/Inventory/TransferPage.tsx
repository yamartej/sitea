"use client";

import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  describePhase3Error, Phase3CompanyPicker, usePhase3Company,
} from "@/components/PurchaseManagement/Phase3Company";

type Warehouse = { id: number; name: string };
type Product = { id: number; name: string };

export default function TransferPage() {
  const {
    token, companyId, setCompanyId, globalUser, companies,
    loadingCompany, companyError,
  } = usePhase3Company();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setSource("");
    setDestination("");
    setProduct("");
    setQuantity("");
    setSuccess("");
    setError("");
    if (!token || !companyId) {
      setWarehouses([]);
      setProducts([]);
      return;
    }

    let alive = true;
    setLoading(true);
    void Promise.all([
      axios.get<Warehouse[]>(process.env.NEXT_PUBLIC_URL_API + "/warehouses", {
        headers: { Authorization: "Bearer " + token },
        params: { company_id: companyId },
      }),
      axios.get<Product[]>(process.env.NEXT_PUBLIC_URL_API + "/products", {
        headers: { Authorization: "Bearer " + token },
        params: { company_id: companyId },
      }),
    ]).then(([warehouseResponse, productResponse]) => {
      if (!alive) return;
      setWarehouses(warehouseResponse.data);
      setProducts(productResponse.data);
    }).catch((cause: unknown) => {
      if (alive) setError(describePhase3Error(cause, "Consultar productos y almacenes"));
    }).finally(() => {
      if (alive) setLoading(false);
    });

    return () => { alive = false; };
  }, [token, companyId]);

  const transfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(quantity);
    if (!token || !companyId || busy || loading) return;
    if (
      !source || !destination || !product ||
      source === destination || !Number.isInteger(amount) || amount <= 0
    ) {
      setError("Seleccione dos almacenes diferentes, un producto y una cantidad entera positiva.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        process.env.NEXT_PUBLIC_URL_API + "/inventory/transfer",
        {
          source_warehouse_id: Number(source),
          destination_warehouse_id: Number(destination),
          product_id: Number(product),
          quantity: amount,
          reference_type: "manual_transfer",
          notes: notes.trim() || undefined,
        },
        { headers: { Authorization: "Bearer " + token } },
      );
      setQuantity("");
      setNotes("");
      setSuccess("Transferencia registrada. Compruebe las salidas y entradas en Kardex.");
    } catch (cause) {
      setError(
        describePhase3Error(cause, "Registrar transferencia") +
        " Si la conexión se perdió, revise Kardex antes de repetir la operación.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto p-5 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Transferencias entre almacenes</h1>
        <p className="text-sm text-gray-600">
          Mover existencias entre almacenes de la misma empresa. La operación
          registra una salida y una entrada en Kardex.
        </p>
      </div>

      <Phase3CompanyPicker
        globalUser={globalUser} companyId={companyId}
        companies={companies} onChange={setCompanyId}
        disabled={busy || loading || loadingCompany}
      />
      {companyError && <p role="alert" className="text-red-700">{companyError}</p>}
      {globalUser && !companyId && (
        <p role="status" className="text-amber-700">Seleccione una empresa para operar.</p>
      )}
      {loading && <p role="status">Cargando productos y almacenes...</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {success && <p role="status" className="text-green-700">{success}</p>}

      <form onSubmit={transfer} className="border rounded-lg p-4 space-y-4">
        <label className="block text-sm font-medium">
          Almacén de origen
          <select className="block mt-1 w-full border rounded p-2"
            value={source} onChange={(e) => setSource(e.target.value)}
            required disabled={!companyId || busy || loading}>
            <option value="">Seleccione un almacén</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Almacén de destino
          <select className="block mt-1 w-full border rounded p-2"
            value={destination} onChange={(e) => setDestination(e.target.value)}
            required disabled={!companyId || busy || loading}>
            <option value="">Seleccione un almacén</option>
            {warehouses.filter((warehouse) => String(warehouse.id) !== source).map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Producto
          <select className="block mt-1 w-full border rounded p-2"
            value={product} onChange={(e) => setProduct(e.target.value)}
            required disabled={!companyId || busy || loading}>
            <option value="">Seleccione un producto</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Cantidad a transferir
          <input className="block mt-1 w-full border rounded p-2"
            type="number" min="1" step="1" value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required disabled={!companyId || busy || loading} />
        </label>

        <label className="block text-sm font-medium">
          Observación (opcional)
          <textarea className="block mt-1 w-full border rounded p-2"
            value={notes} onChange={(e) => setNotes(e.target.value)}
            disabled={!companyId || busy || loading} rows={3} />
        </label>

        <div className="flex flex-wrap gap-4 items-center">
          <button type="submit"
            className="bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-40"
            disabled={!companyId || busy || loading || warehouses.length < 2 || !product}>
            {busy ? "Transfiriendo..." : "Registrar transferencia"}
          </button>
          <Link href="/pages/kardex" className="underline text-blue-700">
            Consultar Kardex
          </Link>
        </div>
      </form>
    </section>
  );
}
