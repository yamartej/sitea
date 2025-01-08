import React from 'react';
import { CartItem } from '@/types/type';

interface ProductTableProps {
    cart: CartItem[];
    onEdit: (productId: number) => void;
    onDelete: (productId: number) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ cart, onEdit, onDelete }) => {
    return (
        <div className="mt-4">
            <table className="min-w-full border-collapse border border-gray-300 text-left">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="px-4 py-2 border border-gray-300">Item</th>
                        <th className="px-4 py-2 border border-gray-300">Descripción</th>
                        <th className="px-4 py-2 border border-gray-300">Cantidad</th>
                        <th className="px-4 py-2 border border-gray-300">Precio</th>
                        <th className="px-4 py-2 border border-gray-300">Total</th>
                        <th className="px-4 py-2 border border-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {cart.map(item => (
                        <tr key={item.productId} className="bg-white hover:bg-gray-100 transition">
                            <td className="px-4 py-2 border border-gray-300">{item.productId}</td>
                            <td className="px-4 py-2 border border-gray-300">{item.name}</td>
                            <td className="px-4 py-2 border border-gray-300">{item.quantity}</td>
                            <td className="px-4 py-2 border border-gray-300">{item.price}</td>
                            <td className="px-4 py-2 border border-gray-300">{item.price * item.quantity}</td>
                            <td className="px-4 py-2 border border-gray-300 text-center">
                                <button className="text-blue-600 hover:underline" onClick={() => onEdit(item.productId)}>
                                    Editar
                                </button>
                                <button className="ml-2 text-red-600 hover:underline" onClick={() => onDelete(item.productId)}>
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;