"use client";

import axios from "axios";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";

export type Phase3Company = { id: number; name: string };

export function describePhase3Error(error: unknown, action: string): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data;
    const permission = detail?.required_permission;
    if (status === 403 && typeof permission === "string") {
      return `${action}: falta el permiso "${permission}" (HTTP 403). Solicite su asignación al administrador.`;
    }
    if (status === 401) return `${action}: sesión vencida o no autorizada. Inicie sesión nuevamente.`;
    if (status === 403) return `${action}: acceso denegado (HTTP 403). Revise la empresa y permisos.`;
    if (status === 422) {
      const fields = detail?.errors && typeof detail.errors === "object"
        ? Object.keys(detail.errors).join(", ")
        : "";
      const message = typeof detail?.message === "string" ? detail.message : "datos incorrectos";
      return `${action}: ${message}${fields ? " — campos: " + fields : ""} (HTTP 422).`;
    }
    if (typeof detail?.message === "string") {
      return `${action}: ${detail.message} (HTTP ${status ?? "?"}).`;
    }
    return `${action}: ${error.response ? "HTTP " + status : "sin respuesta de la API"}.`;
  }
  return error instanceof Error ? `${action}: ${error.message}` : `${action}: error no identificado.`;
}

/**
 * Does not assume a global user's company. They must select it explicitly.
 * The server remains responsible for tenant.cross_company authorization.
 */
export function usePhase3Company() {
  const [token, setToken] = useState("");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [ownCompanyId, setOwnCompanyId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<Phase3Company[]>([]);
  const [globalUser, setGlobalUser] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [companyError, setCompanyError] = useState("");

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const session = await getSession();
        if (!session?.user?.token) throw new Error("No existe una sesión activa.");

        const own = session.user.company_id
          ? Number(session.user.company_id)
          : null;

        if (!active) return;
        setToken(session.user.token);

        if (own !== null && Number.isInteger(own) && own > 0) {
          setCompanyId(own);
          setOwnCompanyId(own);
          return;
        }

        setGlobalUser(true);
        const response = await axios.get<Phase3Company[]>(
          `${process.env.NEXT_PUBLIC_URL_API}/companies`,
          { headers: { Authorization: `Bearer ${session.user.token}` } },
        );
        if (active) setCompanies(response.data);
      } catch (error) {
        if (active) setCompanyError(describePhase3Error(error, "Preparar empresa"));
      } finally {
        if (active) setLoadingCompany(false);
      }
    };
    void initialize();
    return () => { active = false; };
  }, []);

  return {
    token,
    companyId,
    setCompanyId,
    ownCompanyId,
    globalUser,
    companies,
    loadingCompany,
    companyError,
  };
}

type Phase3CompanyPickerProps = {
  globalUser: boolean;
  companyId: number | null;
  companies: Phase3Company[];
  onChange: (id: number | null) => void;
  disabled?: boolean;
};

export function Phase3CompanyPicker({
  globalUser, companyId, companies, onChange, disabled,
}: Phase3CompanyPickerProps) {
  if (!globalUser) return null;
  return (
    <label className="block text-sm font-medium">
      Empresa para operar (obligatoria para administradores globales)
      <select
        className="mt-1 block w-full max-w-md rounded border p-2"
        value={companyId ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">Seleccione una empresa</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>{company.name}</option>
        ))}
      </select>
      <span className="block mt-1 text-xs text-gray-600">
        El servidor verifica si su cuenta está autorizada para trabajar con esta empresa.
      </span>
    </label>
  );
}
