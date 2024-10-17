"use client";

import Dashboard from "@/components/dashboard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin"); // Redirige al login si no está autenticado
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>; // Muestra un loader mientras se verifica la sesión
  }

  return <Dashboard user={session?.user} />;
};

export default DashboardPage;
