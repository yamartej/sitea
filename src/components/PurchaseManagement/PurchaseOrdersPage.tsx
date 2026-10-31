"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { Phase3CompanyPicker, describePhase3Error, usePhase3Company } from "./Phase3Company";

type Supplier = { id: number; company_id: number | null; name: string };
type Product = { id: number; name: string };
type OrderLineInput = { product_id: string; quantity: string; price: string };
const newLine = (): OrderLineInput => ({ product_id: "", quantity: "1", price: "" });

export default function PurchaseOrdersPage() {
  const {
    token, companyId, setCompanyId, globalUser, companies,
    companyError, loadingCompany,
  } = usePhase3Company();
  const [loadWarning, setLoadWarning] = useState("");
  const [supplierNotice, setSupplierNotice] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [tracking, setTracking] = useState("");
  const [shipping, setShipping] = useState("0");
  const [lines, setLines] = useState<OrderLineInput[]>([newLine()]);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<number | null>(null);

  const api = process.env.NEXT_PUBLIC_URL_API;

  const loadSuppliers = async (authToken: string, company: number) => {
    const { data } = await axios.get<Supplier[]>(`${api}/suppliers`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { company_id: company },
    });
    setSuppliers(data.filter((item) => Number(item.company_id) === company));
  };

  useEffect(() => {
    if (!companyId || !token) {
      setSuppliers([]);
      setProducts([]);
      return;
    }

    let active = true;
    const load = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      setLoadWarning("");
      setSuppliers([]);
      setProducts([]);
      const [supplierResult, productResult] = await Promise.allSettled([
        axios.get<Supplier[]>(`${api}/suppliers`, {
          headers, params: { company_id: companyId },
        }),
        axios.get<Product[]>(`${api}/products`, {
          headers, params: { company_id: companyId },
        }),
      ]);
      if (!active) return;
      const warnings: string[] = [];

      if (supplierResult.status === "fulfilled") {
        setSuppliers(supplierResult.value.data.filter((item) =>
          Number(item.company_id) === companyId));
      } else {
        warnings.push(describePhase3Error(supplierResult.reason, "Consultar proveedores"));
      }

      if (productResult.status === "fulfilled") {
        setProducts(productResult.value.data);
      } else {
        warnings.push(describePhase3Error(productResult.reason, "Consultar productos"));
      }
      setLoadWarning(warnings.join(" | "));
    };

    void load();
    return () => { active = false; };
  }, [token, companyId, api]);

  const updateLine = (index: number, field: keyof OrderLineInput, value: string) => {
    setLines((previous) => previous.map((line, i) =>
      i === index ? { ...line, [field]: value } : line));
  };

  const createSupplier = async () => {
    if (!companyId || !token || !supplierName.trim()) {
      setError("Seleccione una empresa y escriba el nombre del proveedor.");
      return;
    }
    setBusy(true);
    setError("");
    setSupplierNotice("");
    try {
      const { data } = await axios.post<Supplier>(
        `${api}/suppliers`,
        {
          name: supplierName.trim(),
          phone: supplierPhone.trim() || null,
          company_id: companyId,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // A successful POST is authoritative even if GET /suppliers is forbidden.
      setSuppliers((previous) => [
        ...previous.filter((item) => item.id !== data.id),
        data,
      ]);
      setSupplierId(String(data.id));
      setSupplierName("");
      setSupplierPhone("");
      setSupplierNotice(`Proveedor #${data.id} guardado correctamente y seleccionado.`);

      try {
        await loadSuppliers(token, companyId);
      } catch (readError) {
        setLoadWarning(describePhase3Error(readError, "Consultar proveedores") +
          " El proveedor ya fue registrado; no repita el envío.");
      }
    } catch (cause) {
      setError(describePhase3Error(cause, "Guardar proveedor"));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId || !token || busy) {
      setError("Seleccione una empresa y confirme su sesión antes de guardar.");
      return;
    }

    const selectedLines = lines.map((line) => ({
      product_id: Number(line.product_id),
      quantity: Number(line.quantity),
      price: Number(line.price),
    }));

    if (!supplierId || Number(shipping) < 0 ||
      selectedLines.some((line) =>
        !Number.isInteger(line.product_id) || line.product_id <= 0 ||
        !Number.isInteger(line.quantity) || line.quantity <= 0 ||
        !Number.isFinite(line.price) || line.price < 0) ||
      new Set(selectedLines.map((line) => line.product_id)).size !== selectedLines.length) {
      setError("Seleccione proveedor y productos distintos, con cantidades y precios válidos.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccessId(null);
    try {
      const { data } = await axios.post<{ id: number }>(
        `${api}/purchaseorders/with-lines`,
        {
          company_id: companyId,
          supplier_id: Number(supplierId),
          shipping_cost: Number(shipping),
          tracking_number: tracking.trim() || null,
          lines: selectedLines,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccessId(data.id);
      setLines([newLine()]);
      setTracking("");
      setShipping("0");
    } catch (cause) {
      setError(describePhase3Error(cause, "Registrar orden") +
        " Antes de reintentar después de un fallo de conexión, confirme que la orden no se haya registrado.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto p-5 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Registrar orden de compra</h1>
        <p className="text-sm text-gray-600">La orden y todos sus productos se guardan en una transacción.</p>
      </div>

      <Phase3CompanyPicker
        globalUser={globalUser} companyId={companyId}
        companies={companies}
        disabled={busy || loadingCompany}
        onChange={(next) => {
          setCompanyId(next);
          setSupplierId("");
          setLines([newLine()]);
          setSuccessId(null);
          setSupplierNotice("");
          setError("");
        }}
      />
      {loadingCompany && <p role="status">Comprobando sesión...</p>}
      {companyError && <p role="alert" className="p-3 border rounded text-red-700">{companyError}</p>}
      {globalUser && !companyId && <p className="text-sm text-amber-700">Seleccione una empresa para registrar proveedores y compras.</p>}
      {loadWarning && <p role="alert" className="p-3 border rounded text-amber-800">{loadWarning}</p>}
      {supplierNotice && <p role="status" className="p-3 border rounded text-green-800">{supplierNotice}</p>}
      {error && <p role="alert" className="p-3 border border-red-300 bg-red-50 rounded text-red-700">{error}</p>}
      {successId && (
        <p role="status" className="p-3 border border-green-300 bg-green-50 rounded">
          Orden #{successId} registrada.{" "}
          <a href="/pages/purchase-receipts" className="underline text-blue-700">Ir a recepción de compras</a>.
        </p>
      )}

      <div className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Proveedor nuevo (opcional)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
            className="border rounded p-2" placeholder="Nombre del proveedor" aria-label="Nombre del proveedor" />
          <input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)}
            className="border rounded p-2" placeholder="Teléfono del proveedor" aria-label="Teléfono del proveedor" />
        </div>
        <button type="button" onClick={() => void createSupplier()}
          disabled={busy || !supplierName.trim() || !token || !companyId}
          className="border border-blue-700 text-blue-700 px-4 py-2 rounded disabled:opacity-50">
          Agregar proveedor
        </button>
      </div>

      <form onSubmit={submit} className="border rounded p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">Proveedor
            <select required className="block w-full border rounded p-2"
              value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Seleccione</option>
              {suppliers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Referencia de seguimiento
            <input className="block w-full border rounded p-2" value={tracking}
              onChange={(e) => setTracking(e.target.value)} />
          </label>
          <label className="text-sm">Costo de envío
            <input required type="number" min="0" step="0.01" className="block w-full border rounded p-2"
              value={shipping} onChange={(e) => setShipping(e.target.value)} />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left">
              <th className="p-2">Producto</th><th className="p-2">Cantidad</th>
              <th className="p-2">Precio unitario</th><th className="p-2">Acción</th>
            </tr></thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">
                    <select required className="border rounded p-2 w-full" value={line.product_id}
                      onChange={(e) => updateLine(index, "product_id", e.target.value)}>
                      <option value="">Seleccione producto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input required type="number" min="1" step="1" className="border rounded p-2 w-24"
                      value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input required type="number" min="0" step="0.01" className="border rounded p-2 w-28"
                      value={line.price} onChange={(e) => updateLine(index, "price", e.target.value)} />
                  </td>
                  <td className="p-2">
                    <button type="button" disabled={busy || lines.length <= 1}
                      onClick={() => setLines((previous) => previous.filter((_, i) => i !== index))}
                      className="text-red-700 underline disabled:opacity-40">Quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => setLines((previous) => [...previous, newLine()])}
            className="px-4 py-2 border rounded">Agregar producto</button>
          <button type="submit" disabled={busy || !token || !companyId}
            className="px-4 py-2 bg-blue-700 text-white rounded disabled:opacity-40">
            {busy ? "Guardando..." : "Registrar orden y renglones"}
          </button>
        </div>
      </form>
    </section>
  );
}
