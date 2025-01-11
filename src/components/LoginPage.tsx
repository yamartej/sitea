"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Notification from "./Common/Notification/NotificationPage";
import { useRouter , useSearchParams } from "next/navigation";
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
          callbackUrl: "/pages/dashboard"
        });
  
        // Verifica si `result` es `undefined` y gestiona la respuesta
        if (result && result.ok) {
          // Redirige manualmente al dashboard
          router.push("/pages/dashboard");
          setShowSpinner(false);
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

      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            alt="Your Company"
            src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600"
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          {showSpinner && (
            <div className="spinner-container">
             <Spinner/>  
            </div>              
          )}
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border py-1.5 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border py-1.5 text-gray-900"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white"
            >
              Sign in
            </button>

            <p className="mt-10 text-center text-sm text-gray-500">---or---</p>
            <button
              onClick={() =>
                signIn("github", {
                  callbackUrl: "/pages/dashboard",
                })
              }
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Login with GitHub
            </button>
            <hr />
            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/pages/dashboard",
                })
              }
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Login with Google
            </button>
            <hr />
            <button
              onClick={() =>
                signIn("facebook", {
                  callbackUrl: "/pages/dashboard",
                })
              }
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Login with Facebook
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            Not a member?{" "}
            <Link 
              href={"/register"} 
              className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
              Start a 14 day free trial
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
