"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Si no hay sesión, redirige a inicio
    if (!session) {
      router.push("/");
    }
    // Si el usuario no ha verificado el correo, redirige a verify-pending
    else if (!session.user.email_verified_at) {
      console.log(
        "Redirigiendo a verify-pending porque el correo no está verificado"
      );
      router.push("/verify-pending");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || !session.user.email_verified_at) {
    return <p>Cargando...</p>; // evita parpadeos de contenido sensible
  }

  return (
    <>
      <div className="p-4 sm:ml-64">
        <div className="p-4 mt-14">
          <h1>Dashboard</h1>
        </div>
      </div>
    </>
  );
}
