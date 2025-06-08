"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Notification from "./Common/Notification/NotificationPage";
import { useRouter, useSearchParams } from "next/navigation";
import { validateEmail } from "@/app/api/auth/[...nextauth]/api";
import Link from "next/link";
import Spinner from "./Common/Spinner/SpinnerPage";

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const message = searchParams.get("message");
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000); // 10 segundos

      return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }
    if (message) {
      setShowSpinner(false);
      setErrorMessage(message);
      setShowNotification(true);
    }
  }, [searchParams, showNotification]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSpinner(true);
    try {
      const emailExists = await validateEmail(email);
      if (emailExists) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false, // Evita redirección automática
          callbackUrl: "/pages/dashboard",
        });

        // Verifica si `result` es `undefined` y gestiona la respuesta
        if (result && result.ok) {
          // Redirige manualmente al dashboard
          router.push("/pages/dashboard");
        } else {
          // Manejo de error en caso de fallo de autenticación
          setErrorMessage("Contraseña incorrecta");
          setShowNotification(true);
          setShowSpinner(false);
        }
      } else {
        setErrorMessage("Correo no registrado o incorrecto");
        setShowNotification(true);
        setShowSpinner(false);
      }
    } catch {
      setErrorMessage("Ocurrió un error al verificar el correo.");
      setShowNotification(true);
      setShowSpinner(false);
    }
  };

  return (
    <>
      {showNotification && errorMessage && (
        <Notification
          message={errorMessage}
          type="error"
          onClose={() => setShowNotification(false)}
        />
      )}

      <div className="flex min-h-screen flex-row">
        {/* Columna izquierda */}
        <div className="hidden w-1/2 lg:flex flex-col justify-center items-center">
          <img
            alt="Your Company"
            src="logo.png"
            className="h-20 w-20 mb-4 bg-white rounded-md"
          />
          <h2 className="text-3xl font-bold text-gray-700 text-center">
            Total<strong>Plus</strong>
          </h2>
          <p className="mt-4 text-center text-gray-500 max-w-sm">
            Bienvenido, inicia sesión para acceder a tu panel personalizado y
            explorar nuevas funciones.
          </p>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="flex w-full lg:w-1/2 flex-col justify-center">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            {/* Solo visible en pantallas medianas en adelante */}
            <h2 className="hidden md:block text-center text-2xl font-bold leading-9 tracking-tight text-white">
              Inicia sesión en tu cuenta
            </h2>

            {/* Solo visible en pantallas pequeñas */}
            <div className="flex flex-col items-center justify-center md:hidden mt-4">
              <img
                alt="Your Company"
                src="logo.png"
                className="h-20 w-20 mb-2 bg-white rounded-md"
              />
              <h2 className="text-2xl font-bold text-gray-700 text-center">
                Total<strong>Plus</strong>
              </h2>
            </div>

            {showSpinner && (
              <div className="spinner-container">
                <Spinner />
              </div>
            )}
          </div>

          <div className="mt-10 p-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white rounded-tr-3xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-500"
                >
                  Correo
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border py-1.5 text-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-500"
                >
                  Clave
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border py-1.5 text-gray-500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
              >
                Iniciar sesión
              </button>

              <p className="mt-10 text-center text-sm text-gray-500">---o---</p>

              <button
                onClick={() =>
                  signIn("github", { callbackUrl: "/pages/dashboard" })
                }
                className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
              >
                Iniciar sesión con GitHub
              </button>
              <hr />
              <button
                onClick={() =>
                  signIn("google", { callbackUrl: "/pages/dashboard" })
                }
                className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
              >
                Iniciar sesión con Google
              </button>
              <hr />
              <button
                onClick={() =>
                  signIn("facebook", { callbackUrl: "/pages/dashboard" })
                }
                className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
              >
                Iniciar sesión con Facebook
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-gray-500">
              ¿No eres miembro?{" "}
              <Link href={"/register"} className="font-semibold text-primary">
                Regístrese
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
