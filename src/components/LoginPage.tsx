"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateEmail = async (email: string): Promise<boolean> => {
    alert("Entró con el email:" + email);

    try {
        const response = await axios.post(
            'http://127.0.0.1:8000/api/check-email',
            { email },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("Respuesta=", response);

        // Asegurarse de que la respuesta es como se espera
        if (response.data.exists) {
            return true; // Si el email existe en la base de datos
        } else {
            return false; // Si el email no existe en la base de datos
        }
    } catch (error) {
        console.error("Error al verificar el correo:", error);
        // Manejo del error si ocurre un problema con la solicitud
        return false;
    }
};

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailExists = await validateEmail(email);

    if (emailExists) {
      signIn("credentials", { email, password });
    }
  };

  return (
    <>
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
          </div>
  
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
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
            <p className="mt-10 text-center text-sm text-gray-500">
                ---or---
            </p>
            <button onClick={() => signIn('github', {
                callbackUrl: "/dashboard",
            })} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Login with GitHub
            </button>
            <hr />
            <button onClick={() => signIn('google', {
                callbackUrl: "/dashboard",
            })} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Login with Google
            </button>
            <hr />
            <button onClick={() => signIn('facebook', {
                callbackUrl: "/dashboard",
            })} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Login with Facebook
            </button>
          </form>
  
            <p className="mt-10 text-center text-sm text-gray-500">
              Not a member?{' '}
              <a href="#" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                Start a 14 day free trial
              </a>
            </p>
          </div>
        </div>
      </>
  );
};

export default Login;
  