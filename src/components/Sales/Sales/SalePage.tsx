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
    console.log(filteredProducts);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <>
            <div>
                <div>
                    <label>Cédula de Identidad:</label>
                    <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                    />
                    <button onClick={handleSearch}>Buscar</button>
                </div>
                <div>
                    <label>Nombre:</label>
                    <input type="text" value={client.name} readOnly />
                </div>
                <div>
                    <label>Dirección:</label>
                    <input type="text" value={client.address} readOnly />
                </div>
                <div>
                    <label>Teléfono:</label>
                    <input type="text" value={client.phone} readOnly />
                </div>
            </div>
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
        </>
    );
};

export default SalePage;
