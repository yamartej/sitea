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
          value !== formData.password
            ? "Las contraseñas no coinciden"
            : null,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowNotification(false);
    setShowSpinner(true);
    if (!formData.termsAccepted) {
      setErrors({ ...errors, termsAccepted: "Debe aceptar los términos y condiciones" });
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
            formData.passwordConfirmation
        );
        setShowNotification(true);
        setTypeMessage("success");
        setErrorMessage(response.message); 
        setShowSpinner(false);
    } catch (errors) {
        console.error("Error:", errors);
        // Mostrar los errores de la API en el componente de notificación
        if (typeof errors === 'object' && errors !== null) {
          if ('password' in errors && Array.isArray(errors.password)) {
            setShowNotification(true);
            setTypeMessage("error");
            setErrorMessage(errors.password.join(" ")); 
            setShowSpinner(false);
          }
          if ('email' in errors && Array.isArray(errors.email)) {
            setShowNotification(true);
            setTypeMessage("error");
            setErrorMessage(errors.email.join(" ")); 
            setShowSpinner(false);
          }
        }
      }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      {showNotification && errorMessage && (
        <Notification
          message={errorMessage}
          type={typeMessage}
          onClose={() => setShowNotification(false)}
        />
      )}    
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Create an account
        </h2>
        {showSpinner && (
          <div className="spinner-container">
            <Spinner/>  
          </div>              
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="block w-full rounded-md border py-1.5 text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
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
              value={formData.password}
              onChange={handleInputChange}
              required
              className="block w-full rounded-md border py-1.5 text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-900">
              Password Confirmation
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              value={formData.passwordConfirmation}
              onChange={handleInputChange}
              required
              className="block w-full rounded-md border py-1.5 text-gray-900"
            />
            {errors.passwordMatch && (
              <p className="text-red-500 text-sm mt-1">{errors.passwordMatch}</p>
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
            <label htmlFor="terms" className="ml-3 text-sm font-light text-gray-500">
              I accept the <a href="#" className="font-bold text-indigo-500 hover:underline">Terms and Conditions</a>
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-red-500 text-sm mt-1">{errors.termsAccepted}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Create an account
          </button>
          <p className="text-sm font-light text-gray-500">
            Already have an account? <Link href={"/"} className="font-bold text-indigo-500 hover:underline">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
