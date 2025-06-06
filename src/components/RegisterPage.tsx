"use client";
import { useState, useEffect } from "react";
import { register } from "@/app/api/auth/[...nextauth]/api";
import { useSearchParams } from "next/navigation";
import Notification from "./Common/Notification/NotificationPage";
import Link from "next/link";
import Spinner from "./Common/Spinner/SpinnerPage";

const RegisterPage = () => {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeMessage, setTypeMessage] = useState("error");
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
      setShowSpinner(true);
      setErrorMessage(message);
      setShowNotification(true);
    }
  }, [searchParams, showNotification]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    termsAccepted: false,
    company: "",
  });

  const [errors, setErrors] = useState<{
    passwordMatch: string | null;
    termsAccepted: string | null;
  }>({
    passwordMatch: null,
    termsAccepted: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Validación en tiempo real de las contraseñas
    if (name === "passwordConfirmation") {
      setErrors({
        ...errors,
        passwordMatch:
          value !== formData.password ? "Las contraseñas no coinciden" : null,
      });
    }
  };

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000); // 10 segundos
      return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }
  }, [showNotification]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowNotification(false);
    setShowSpinner(true);
    if (!formData.termsAccepted) {
      setErrors({
        ...errors,
        termsAccepted: "Debe aceptar los términos y condiciones",
      });
      return;
    } else {
      setErrors({ ...errors, termsAccepted: null });
    }
    if (errors.passwordMatch) {
      setErrorMessage("Validar password");
      setShowNotification(true);
      return;
    }

    try {
      const response = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.passwordConfirmation,
        formData.company
      );
      setShowNotification(true);
      setTypeMessage("success");
      setErrorMessage(response.message);
      setFormData({
        name: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        termsAccepted: false,
        company: "",
      });
    } catch (errors) {
      console.error("Error:", errors);
      // Mostrar los errores de la API en el componente de notificación
      if (typeof errors === "object" && errors !== null) {
        if ("password" in errors && Array.isArray(errors.password)) {
          setShowNotification(true);
          setTypeMessage("error");
          setErrorMessage(errors.password.join(" "));
        }
        if ("email" in errors && Array.isArray(errors.email)) {
          setShowNotification(true);
          setTypeMessage("error");
          setErrorMessage(errors.email.join(" "));
        }
      }
    } finally {
      setShowSpinner(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div>
        {showNotification && errorMessage && (
          <Notification
            message={errorMessage}
            type={typeMessage}
            onClose={() => setShowNotification(false)}
          />
        )}
      </div>
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
        <h2 className="text-2xl font-bold text-gray-700 text-center">
          Total<strong>Plus</strong>
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm bg-white rounded-tr-3xl p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-500"
            >
              Nombre de Empresa
            </label>
            <input
              id="company"
              name="company"
              type="text"
              value={formData.company}
              onChange={handleInputChange}
              required
              className="block w-full rounded-md border py-1.5 text-gray-500"
            />
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-500"
            >
              Nombre y Apellido
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="block w-full rounded-md border py-1.5 text-gray-500"
            />
          </div>
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
              value={formData.email}
              onChange={handleInputChange}
              required
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
              value={formData.password}
              onChange={handleInputChange}
              required
              className="block w-full rounded-md border py-1.5 text-gray-500"
            />
          </div>
          <div>
            <label
              htmlFor="passwordConfirmation"
              className="block text-sm font-medium text-gray-500"
            >
              Confirmación de clave
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              value={formData.passwordConfirmation}
              onChange={handleInputChange}
              required
              className="block w-full rounded-md border py-1.5 text-gray-500"
            />
            {errors.passwordMatch && (
              <p className="text-red-500 text-sm mt-1">
                {errors.passwordMatch}
              </p>
            )}
          </div>
          <div className="flex items-start">
            <input
              id="terms"
              name="termsAccepted"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className="w-4 h-4 border-gray-300 rounded"
              required
            />
            <label
              htmlFor="terms"
              className="ml-3 text-sm font-light text-gray-500"
            >
              Acepto el{" "}
              <a href="#" className="font-bold text-primary hover:underline">
                Términos y condiciones
              </a>
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-red-500 text-sm mt-1">{errors.termsAccepted}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
          >
            Crear una cuenta
          </button>
          <p className="text-sm font-light text-gray-500">
            ¿Ya tienes una cuenta?{" "}
            <Link href={"/"} className="font-bold text-primary hover:underline">
              Inicie sesión aquí
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
