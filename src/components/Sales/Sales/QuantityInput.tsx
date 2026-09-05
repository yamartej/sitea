import React, { useState, useEffect } from 'react';

interface QuantityInputProps {
  itemKey: string;
  maxQuantity: number;
  onQuantityChange: (itemKey: string, value: number) => void;
  reset: boolean;
  disabled: boolean | any; // Añadimos una prop para deshabilitar el input
}

const QuantityInput: React.FC<QuantityInputProps> = ({ itemKey, maxQuantity, onQuantityChange, reset, disabled }) => {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (reset) {
      setQuantity(1);
    }
  }, [reset]);

  const handleDecrement = () => {
    setQuantity((prevQuantity) => {
      const newQuantity = Math.max(prevQuantity - 1, 1);
      onQuantityChange(itemKey, newQuantity);
      return newQuantity;
    });
  };

  const handleIncrement = () => {
    setQuantity((prevQuantity) => {
      const newQuantity = Math.min(prevQuantity + 1, maxQuantity);
      onQuantityChange(itemKey, newQuantity);
      return newQuantity;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1));
    setQuantity(value);
    onQuantityChange(itemKey, value);
  };

  return (
    <div className="relative flex items-center max-w-[12rem]">
      <button
        type="button"
        onClick={handleDecrement}
        className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-md px-2 py-2 h-9 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 focus:outline-none"
        disabled={disabled}
      >
        <svg className="w-4 h-4 text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1h16" />
        </svg>
      </button>

      <input
        type="text"
        value={quantity}
        onChange={handleChange}
        className="bg-gray-50 border-x-0 border-gray-300 h-9 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-[6rem] px-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        required
        disabled={disabled}
      />

      <button
        type="button"
        onClick={handleIncrement}
        className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-md px-2 py-2 h-9 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 focus:outline-none"
        disabled={disabled}
      >
        <svg className="w-4 h-4 text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 1v16M1 9h16" />
        </svg>
      </button>
    </div>

  );
};

export default QuantityInput;