"use client";
import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { getClientById } from '@/app/api/sale/api';
import { getPopByUserId } from '@/app/api/admin/api';
import { Product, CartItem } from '@/types/type';
import { fetchInventoriesList } from '@/app/api/inventory/api';
import Modal from '@/components/Common/Modal/ModalPage';
import ProductTable from './ProductTablePage';
import QuantityInput from './QuantityInput';
import Notification from '@/components/Common/Notification/NotificationPage';

const SalePage: React.FC = () => {
    const [clientId, setClientId] = useState('');
    const [client, setClient] = useState({ client_id: '', name: '', address: '', phone: '' });
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [showNotification, setShowNotification] = useState(false);
    const [typeMessage, setTypeMessage] = useState("error");
    const [btnAction, setBtnAction] = useState(false);
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [resetQuantities, setResetQuantities] = useState(false);
    const [sellerName, setSellerName] = useState('');
    const [machineName, setMachineName] = useState('');
    
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

    useEffect(() => {
        if (showNotification) {
          const timer = setTimeout(() => {
              setShowNotification(false);
          }, 10000); // 10 segundos
    
          return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
        }
        if (error) {
          setError('');
          setShowNotification(true);
        }
      }, [showNotification]);

      useEffect(() => {
        const fetchSellerAndMachine = async () => {
          const session = await getSession();
          if (session && session.user.roles.includes('Vendedor')) {
            const response = await getPopByUserId(session.user.token, Number(session.user.id));
            if (response) {
              console.log(response.data[0]);
              console.log(response.data[0].point_of_sale);
              setSellerName(response.data[0].user.name);
              setMachineName(response.data[0].point_of_sale.identifier);
            }
          }
        };
    
        fetchSellerAndMachine();
      }, []);

    
    const handleClientSearch = async () => {
        try {
            if(!clientId) {
                setError('Client ID is required');
                setShowNotification(true);
            }
            else{
                setError('');
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
            }
            
        } catch (err) {
            setError('Error fetching client');
        }
    };

    const getMaxQuantity = (productId: number, totalQuantity: number) => {
        const cartItem = cart.find(item => item.productId === productId);
        return cartItem ? totalQuantity - cartItem.quantity : totalQuantity;
      };

    const handleAddToCart = (product: Product, quantity: number) => {
        console.log(product);
        console.log(quantity);
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

    const handleEditClick = (productId: number) => {
        // Lógica para editar el producto en el carrito
    };

    const handleDelete = (productId: number) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const handleQuantityChange = (productId: number, value: number) => {
        setQuantities((prevQuantities) => ({
          ...prevQuantities,
          [productId]: value,
        }));
      };

      useEffect(() => {
        if (!isModalOpen) {
          setResetQuantities(true);
          setQuantities({});
        } else {
          setResetQuantities(false);
        }
      }, [isModalOpen]);



    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
        {showNotification && error && (
            <Notification
            message={error}
            type={typeMessage}
            onClose={() => setShowNotification(false)}
            />
        )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-blue-500 col-span-1 sm:col-span-2 md:col-span-2 p-4">
                <div>
                  <div className="grid gap-6 mb-6 md:grid-cols-2">
                    <div>
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
                                onClick={handleClientSearch}
                                className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                >
                                Buscar
                            </button>
                        </div>
                    </div>
                    <div>
                    </div>
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Nombre
                        </label>
                        <input 
                            type="text" 
                            id="name"
                            value={client?.name || ''} 
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
                            value={client?.phone || ''} 
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
                        value={client?.address || ''} 
                        readOnly
                    />
                  </div>
                </div>
              </div>
                            <div className="bg-red-500 p-4">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button  
                    onClick={() => setIsModalOpen(true)}
                    type="button" 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
                    disabled={!clientId || !!btnAction}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    Buscar Productos
                  </button>
                </div>
                <div className="mt-4">
                  <div className="mb-2">
                    <h1 className="font-semibold">Vendedor:</h1>
                    <span>{sellerName || 'No asignado'}</span>
                  </div>
                  <div>
                    <h1 className="font-semibold">Caja:</h1>
                    <span>{machineName || 'No asignada'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-500 p-4">
                <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
                    <p> <strong>Subtotal:</strong>   ${totalAmount.toFixed(2)}</p>
                    <p> <strong>IVA (16%):</strong>   20 $</p>
                    <div className='text-center'>
                        <button onClick={() => console.log('Confirmar Compra')} className="mt-2 p-2 bg-green-500 text-white rounded-lg"
                            disabled={!!btnAction}>
                            Confirmar Compra
                        </button>
                    </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
                <div>
                    <div className="flex justify-between items-center">
                        <h1 className="">Productos seleccionados</h1>
                    </div>
                </div>
                <ProductTable cart={cart} onEdit={handleEditClick} onDelete={handleDelete} />
                {/* Diseño de tarjetas para pantallas pequeñas */}
                <div className="block md:hidden mt-2 space-y-4">
                    {cart.map(item => (
                    <div key={item.productId} className="p-4 bg-white rounded-lg shadow border border-gray-300">
                        <p>
                            <span className="font-semibold">Descripción:</span> {item.name}
                        </p>
                        <p>
                            <span className="font-semibold">Cantidad:</span> {item.quantity}
                        </p>
                        <p>
                            <span className="font-semibold">Precio:</span> {item.price}
                        </p>
                        <p>
                            <span className="font-semibold">Total:</span> {item.price * item.quantity}
                        </p>
                        <div className="mt-2 flex justify-end space-x-2">
                            <button
                                className="text-blue-600 hover:underline"
                                >
                                Editar
                            </button>
                            <button
                                className="text-red-600 hover:underline"
                                >
                                Eliminar
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
            
            <Modal title="Buscar Productos" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className='max-w-md mx-auto'>
            <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                </svg>
              </div>
              <input 
                type="search" 
                id="default-search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="descripcion del producto" required />
              <button type="submit" className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
            </div>
          </div>
          <div>
            <div>
              <p className="text-lg text-gray-900 dark:text-white">Productos disponibles:</p> 
            </div>
            <hr />
            <div className="mt-4">
              <table className="hidden md:block min-w-full border-collapse border border-gray-300 text-left">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 border border-gray-300">Item</th>
                    <th className="px-4 py-2 border border-gray-300">Precio</th>
                    <th className="px-4 py-2 border border-gray-300">Disponibilidad</th>
                    <th className="px-4 py-2 border border-gray-300">Cantidad</th>
                    <th className="px-4 py-2 border border-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts?.map((product: any) => {
                    const maxQuantity = getMaxQuantity(product.product_id, product.quantity);
                    const cartItem = cart.find(item => item.productId === product.product_id);
                    const isDisabled = !!(cartItem && cartItem.quantity >= product.quantity);

                    return (
                      <tr key={product.product_id} className="bg-white hover:bg-gray-100 transition">
                        <td className="px-4 py-2 border border-gray-300">{product.product.name}</td>
                        <td className="px-4 py-2 border border-gray-300">{product.product.price}</td>
                        <td className="px-4 py-2 border border-gray-300">{product.quantity}</td>
                        <td className="px-4 py-2 border border-gray-300">
                          <QuantityInput
                            productId={product.product_id}
                            maxQuantity={maxQuantity}
                            onQuantityChange={handleQuantityChange}
                            reset={resetQuantities}
                            disabled={isDisabled}
                          />
                        </td>
                        <td className="px-4 py-2 border border-gray-300">
                          <button
                            type="button"
                            className="p-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                            onClick={() =>
                              handleAddToCart(
                                product.product,
                                quantities[product.product_id] || 1
                              )
                            }
                            disabled={isDisabled}
                          >
                            Agregar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => setIsModalOpen(false)}
              className="mt-4 p-2 bg-red-500 text-white rounded-lg"
            >
              Cerrar
            </button>
          </div>
          {/* Diseño de tarjetas para pantallas pequeñas */}
          <div className="block md:hidden mt-2 space-y-4">
            {filteredProducts?.map((product: any) => {
              const maxQuantity = getMaxQuantity(product.product_id, product.quantity);
              const cartItem = cart.find(item => item.productId === product.product_id);
              const isDisabled = cartItem && cartItem.quantity >= product.quantity;

              return (
                <div key={product.product_id} className="p-4 bg-white rounded-lg shadow border border-gray-300">
                  <p>
                    <span className="font-semibold">Descripción:</span> {product.product.name}
                  </p>
                  <p>
                    <span className="font-semibold">Precio:</span> {product.product.price}
                  </p>
                  <p>
                    <span className="font-semibold">Disponibilidad:</span> {product.quantity}
                  </p>
                  <QuantityInput
                    productId={product.product_id}
                    maxQuantity={maxQuantity}
                    onQuantityChange={handleQuantityChange}
                    reset={resetQuantities}
                    disabled={isDisabled}
                  />
                  <button 
                    type="button" 
                    className="p-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                    onClick={() => handleAddToCart(product.product, quantities[product.product_id] || 1)}
                    disabled={isDisabled}
                  >
                    Agregar 
                  </button>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleEditClick(product)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(product.product_id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
        </>
    );
    };

export default SalePage;
