"use client";

import React, { useEffect, useState } from "react";
import {
  Phase3CompanyPicker,
  describePhase3Error,
  usePhase3Company,
} from "@/components/PurchaseManagement/Phase3Company";
import {
  fetchReconciliation,
  ReconciliationReport,
} from "@/app/api/finance/reconciliation";

const displayAmount = (value: string | number) =>
  Number(value).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function FinancialReconciliationPage() {
  const {
    token, companyId, setCompanyId, globalUser, companies, loadingCompany, companyError,
  } = usePhase3Company();
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token || !companyId) {
      setReport(null);
      setError("");
      return;
    }
    let active = true;
    const load = async () => {
      setReport(null);
      setLoading(true);
      setError("");
      try {
        const result = await fetchReconciliation(token, companyId);
        if (active) setReport(result);
      } catch (cause) {
        if (active) setError(describePhase3Error(cause, "Consultar conciliación de cartera"));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, companyId, reload]);

  const summary = report?.summary;

  return (
    <section className="mx-auto max-w-6xl space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-semibold">Conciliación de cartera</h1>
        <p className="text-sm text-gray-600">
          Consulta por empresa de ventas a crédito, pagos aplicados a ventas y abonos directos.
          Solo lectura: esta pantalla no crea, modifica ni distribuye pagos.
        </p>
      </div>

      <Phase3CompanyPicker
        globalUser={globalUser}
        companyId={companyId}
        companies={companies}
        onChange={setCompanyId}
        disabled={loading || loadingCompany}
      />
      {loadingCompany && <p role="status">Verificando sesión...</p>}
      {companyError && <p role="alert" className="text-red-700">{companyError}</p>}
      {globalUser && !companyId && (
        <p className="text-amber-700">Seleccione una empresa autorizada para consultar su cartera.</p>
      )}
      {error && <p role="alert" className="border border-red-300 rounded p-3 text-red-700">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {companyId ? `Empresa #${companyId}` : "Sin empresa seleccionada"}
        </p>
        <button
          type="button"
          className="border rounded px-3 py-2 text-sm disabled:opacity-50"
          disabled={!token || !companyId || loading}
          onClick={() => setReload((current) => current + 1)}
        >
          {loading ? "Consultando..." : "Actualizar"}
        </button>
      </div>

      {report && summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Ventas a crédito", summary.credit_sales_total],
              ["Pagos por venta", summary.sale_payments_total],
              ["Saldo por ventas", summary.sale_balance],
              ["Abonos sin asignar", summary.customer_payments_unallocated],
            ].map(([label, value]) => (
              <div key={label} className="border rounded p-4">
                <p className="text-xs text-gray-600">{label}</p>
                <p className="text-xl font-semibold tabular-nums">{displayAmount(value)}</p>
              </div>
            ))}
          </div>

          <p className="border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">
            {report.notice}
          </p>

          <p className="text-sm text-gray-600">
            {summary.credit_sales_count} ventas a crédito; {summary.customers_count} clientes con movimientos.
            Importes en las unidades monetarias registradas por TotalPlus.
          </p>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3 text-right">Ventas</th>
                  <th className="p-3 text-right">Total a crédito</th>
                  <th className="p-3 text-right">Pagos por venta</th>
                  <th className="p-3 text-right">Saldo por ventas</th>
                  <th className="p-3 text-right">Abonos sin asignar</th>
                </tr>
              </thead>
              <tbody>
                {report.customers.map((customer) => (
                  <tr key={customer.customer_id} className="border-b">
                    <td className="p-3">{customer.customer_name} (#{customer.customer_id})</td>
                    <td className="p-3 text-right">{customer.credit_sales_count}</td>
                    <td className="p-3 text-right tabular-nums">{displayAmount(customer.credit_sales_total)}</td>
                    <td className="p-3 text-right tabular-nums">{displayAmount(customer.sale_payments_total)}</td>
                    <td className="p-3 text-right tabular-nums">{displayAmount(customer.sale_balance)}</td>
                    <td className="p-3 text-right tabular-nums">{displayAmount(customer.customer_payments_unallocated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.customers.length === 0 && (
              <p className="p-4 text-sm text-gray-600">No hay movimientos de crédito para esta empresa.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
