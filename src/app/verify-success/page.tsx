"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifySuccessPage() {
  const [message, setMessage] = useState("Su correo se encuentra verificado");
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
      <div className="flex flex-col items-center justify-center p-2">
        <img
          alt="Your Company"
          src="logo.png"
          className="h-20 w-20 mb-2 bg-white rounded-md"
        />
        <h2 className="text-2xl font-bold text-primary-contrast text-center">
          Total<strong className="text-primary-contrast">Plus</strong>
        </h2>
      </div>
      <h1 className="text-2xl font-bold text-primary">¡Correo verificado!</h1>
      <p className="mt-4 text-lg text-primary-contrast">{message}</p>
      <Link href={"/"} className="font-bold text-primary hover:underline">
        Inicie sesión aquí
      </Link>
    </main>
  );
}
