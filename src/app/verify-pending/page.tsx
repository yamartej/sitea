// app/verify-pending/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { resendVerification } from "@/app/api/auth/[...nextauth]/api";
import Spinner from "@/components/Common/Spinner/SpinnerPage";

export default function VerifyPendingPage() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);

  const handleResend = async () => {
    setShowSpinner(true);
    if (!session?.user.email) return;

    setStatus("sending");
    try {
      const res = await resendVerification(
        session.user.token,
        session.user.email
      );
      if (res) {
        setStatus("sent");
        setMessage(
          "Correo de verificación reenviado. Revisa tu bandeja de entrada."
        );
      } else {
        setStatus("error");
        setMessage("Error al reenviar el correo.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Error de red. Intenta de nuevo.");
    } finally {
      setShowSpinner(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div>
        {showSpinner && (
          <div className="spinner-container">
            <Spinner />
          </div>
        )}
      </div>

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
      <h1 className="text-2xl font-semibold mb-4 text-primary">
        Verifica tu correo
      </h1>
      <p className="mb-4 text-primary-contrast">
        Te hemos enviado un correo electrónico con un enlace para verificar tu
        cuenta.
      </p>

      <button
        onClick={handleResend}
        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={status === "sending" || status === "sent"}
      >
        {status === "sending"
          ? "Enviando..."
          : "Reenviar correo de verificación"}
      </button>

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
