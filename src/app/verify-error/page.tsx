"use client";
import { useSearchParams } from "next/navigation";

export default function VerifyError() {
  const params = useSearchParams();
  const reason = params.get("reason");

  const message =
    reason === "invalid-signature"
      ? "El enlace ha expirado o ha sido modificado. Por favor, solicita uno nuevo."
      : "Ha ocurrido un error al verificar tu correo.";

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
      <h1 className="text-2xl font-bold text-primary">Error de verificación</h1>
      <p className="mt-4 text-lg text-primary-contrast">{message}</p>
    </main>
  );
}
