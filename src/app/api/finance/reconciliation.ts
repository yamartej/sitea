import axios from "axios";

export type ReconciliationCustomer = {
  customer_id: number;
  customer_name: string;
  credit_sales_count: number;
  credit_sales_total: string;
  sale_payments_total: string;
  sale_balance: string;
  customer_payments_unallocated: string;
};

export type ReconciliationReport = {
  company_id: number;
  summary: {
    customers_count: number;
    credit_sales_count: number;
    credit_sales_total: string;
    sale_payments_total: string;
    sale_balance: string;
    customer_payments_unallocated: string;
  };
  customers: ReconciliationCustomer[];
  notice: string;
};

export async function fetchReconciliation(
  token: string,
  companyId: number,
): Promise<ReconciliationReport> {
  const response = await axios.get<ReconciliationReport>(
    `${process.env.NEXT_PUBLIC_URL_API}/credits/reconciliation`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { company_id: companyId },
    },
  );
  return response.data;
}
