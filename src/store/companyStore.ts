import { create } from "zustand";

interface Company {
  id: number;
  name: string;
  // agrega más campos si tu API retorna otros datos
}

interface CompanyStore {
  companies: Company[];
  setCompanies: (companies: Company[]) => void;
  clearCompanies: () => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  companies: [],
  setCompanies: (companies) => set({ companies }),
  clearCompanies: () => set({ companies: [] }),
}));
