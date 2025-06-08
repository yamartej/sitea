"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifySuccessPage() {
  const [message, setMessage] = useState("Verificando tu correo...");
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMessage("Redirigiendo al inicio de sesión...");
    }, 3000);

    const redirectTimeout = setTimeout(() => {
      router.push("/");
    }, 5000); // 5 segundos después de cargar

    return () => {
      clearTimeout(timeout);
      clearTimeout(redirectTimeout);
    };
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-2xl font-bold text-green-600">¡Correo verificado!</h1>
      <p className="mt-4 text-lg text-gray-700">{message}</p>
    </main>
  );
}
