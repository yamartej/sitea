"use client";
import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { getClientById } from '@/app/api/sale/api';
import { Product, CartItem } from '@/types/type';
import { fetchProductsList } from '@/app/api/admin/api';
import { fetchInventoriesList } from '@/app/api/inventory/api';

const SalePage: React.FC = () => {
    const [clientId, setClientId] = useState('');
    const [client, setClient] = useState({ client_id: '', name: '', address: '', phone: '' });
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const session = await getSession();
                if (session?.user.token) {
                    const data = await fetchInventoriesList(session.user.token); // Ajusta la URL según tu API
                    console.log(data);
                    setProducts(data);
                } else {
                    setError('No session token found');
                }
            } catch (err) {
                setError('Error fetching products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleSearch = async () => {
        try {
            const session = await getSession();
            if (session?.user.token) {
                const getClient = await getClientById(clientId, session.user.token);
                console.log(getClient[0]);
                setClient({
                    client_id: getClient[0].client_id,
                    name: getClient[0].name,
                    address: getClient[0].address,
                    phone: getClient[0].phone
                });
            } else {
                setError('No session token found');
            }
        } catch (err) {
            setError('Error fetching client');
        }
    };

    const handleAddToCart = (product: Product, quantity: number) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [...prevCart, { productId: product.id, name: product.name, price: product.price, quantity }];
            }
        });
    };

    const filteredProducts = products.filter(product =>
        product.product.name && searchTerm && product.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <>
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-10">
                    <div className="max-w-md">   
                        <label htmlFor="clientId" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Buscar</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                </svg>
                            </div>
                            <input 
                                type="search" 
                                id="clientId"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                                placeholder="Cedula de Identidad" 
                                required />
                            <button 
                                type="button"
                                onClick={handleSearch}
                                className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                    
                                    Buscar
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-2">
                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Nombre
                                </label>
                                <input 
                                    type="text" 
                                    id="name"
                                    value={client.name} 
                                    readOnly
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Teléfono
                                </label>
                                <input 
                                    type="text" 
                                    id="phone"
                                    value={client.phone} 
                                    readOnly
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                                />
                            </div>
                        </div>    
                        <div className="mb-6">
                            <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Dirección
                            </label>
                            <input 
                                type="text" 
                                id="address" 
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                                value={client.address} 
                                readOnly
                            />
                        </div> 
                    </div>
                </div>
                <div className="col-span-2">
                    <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
                        <p> <strong>Total:</strong>   ${totalAmount.toFixed(2)}</p>
                        <button onClick={() => console.log('Confirmar Compra')} className="mt-2 p-2 bg-green-500 text-white rounded-lg">
                            Confirmar Compra
                        </button>
                    </div>
                    
                </div>
            </div>
            <hr />
            <div>
                <label>Buscar Producto:</label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div>
                <h2>Productos Disponibles</h2>
                <ul>
                    {filteredProducts?.map((product: any) => (
                        <li key={product.id}>
                            {product.product.name} - ${product.product.price} - {product.quantity} disponibles
                            <input
                                type="number"
                                min="1"
                                max={product.quantity}
                                defaultValue="1"
                                id={`quantity-${product.id}`}
                            />
                            <button
                                onClick={() =>
                                    handleAddToCart(
                                        product.product,
                                        parseInt((document.getElementById(`quantity-${product.id}`) as HTMLInputElement).value)
                                    )
                                }
                            >
                                Agregar al Carrito
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
                <div>
                    <div className="flex justify-between items-center">
                        <h1 className="">Tabla Clientes</h1>
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                            <button  id="add_user" type="button" className="inline-flex items-center px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
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
                                <tr  key={item.productId} className="bg-white hover:bg-gray-100 transition">
                                    <td className="px-4 py-2 border border-gray-300">{item.productId}</td>
                                    <td className="px-4 py-2 border border-gray-300">{item.name}</td>
                                    <td className="px-4 py-2 border border-gray-300">{item.quantity}</td>
                                    <td className="px-4 py-2 border border-gray-300">{item.price}</td>
                                    <td className="px-4 py-2 border border-gray-300">{item.price * item.quantity}</td>
                                    <td className="px-4 py-2 border border-gray-300 text-center">
                                        <button className="text-blue-600 hover:underline"
                                            
                                        >Editar</button>
                                        <button
                                            className="ml-2 text-red-600 hover:underline"
                                            
                                        >
                                        Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default SalePage;
