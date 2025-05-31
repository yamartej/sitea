"use client";
import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { getClientById, registerSale} from '@/app/api/sale/api';
import { fetchCustomersList } from '@/app/api/admin/api';
import { getPopByUserId } from '@/app/api/admin/api';
import { Product, CartItem, Customer } from '@/types/type';
import { fetchInventoriesList } from '@/app/api/inventory/api';
import Modal from '@/components/Common/Modal/ModalPage';
import ProductTable from './ProductTablePage';
import QuantityInput from './QuantityInput';
import Notification from '@/components/Common/Notification/NotificationPage';
import Spinner from '@/components/Common/Spinner/SpinnerPage';


const SalePage: React.FC = () => {
  const [clientId, setClientId] = useState('');
  const [client, setClient] = useState({ id: '', client_id: '', name: '', address: '', phone: '' });
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
  const [seller, setSeller] = useState<any>({});
  const [isModalConfirmOpen, setIsModalConfirmOpen] = useState<boolean>(false);
  const [typeOfSale, setTypeOfSale] = useState<string>('normal'); // "contado" es el valor por defecto
  const [showSpinner, setShowSpinner] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const session = await getSession();
        if (session?.user.token) {
          const data = await fetchInventoriesList(session.user.token); // Ajusta la URL según tu API
          const sellerInfo = await getPopByUserId(session.user.token, Number(session.user.id));
          setSeller(sellerInfo.data[0]);
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
          setSellerName(response.data[0].user.name);
          setMachineName(response.data[0].point_of_sale.identifier);
        }
      }
    };

    fetchSellerAndMachine();
  }, []);


  const handleClientSearch = async () => {
    try {
      if (!clientId) {
        setError('Client ID is required');
        setShowNotification(true);
      }
      else {
        setError('');
        const session = await getSession();
        if (session?.user.token) {
          const getClient = await getClientById(clientId, session.user.token);
          setClient({
            id: getClient[0].id,
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
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      const price = quantity >= 3 ? Number(product.wholesale_final_cost) : Number(product.final_cost);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { productId: product.id, name: product.name, price: price, quantity }];
      }
    });

  };

  const filteredProducts = products.filter(
    product =>
      product.product.name &&
      searchTerm &&
      product.product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.quantity >= 1 // Filtrar productos con cantidad >= 1
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

  const updateInventory = (cart: CartItem[]) => {
    const updatedProducts = [...products]; // Copia del estado actual de los productos
    cart.forEach(item => {
      const productIndex = updatedProducts.findIndex(product => product.product_id === item.productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex].quantity -= item.quantity;
      }
    });
    setProducts(updatedProducts); // Actualizar el estado de los productos
  };

  const handleSelectTypeSale = () => {
    setIsModalConfirmOpen(true);
  }

  const handleConfirmSale = async () => {
    try {
      setBtnAction(true);
      setLoading(true);
      setLoading(true);
      const session = await getSession();
      if (session?.user.token) {
        const response = await registerSale(
          session.user.token,
          client.id,
          seller.seller_id,
          seller.id,
          totalAmount,
          cart,
          typeOfSale,
        )
        if (response) {
          //actualizar estado de inventario
          setLoading(false);
          setIsModalConfirmOpen(false);
          updateInventory(cart);
          setShowNotification(true);
          setTypeMessage("success");
          setError('Venta realizada con éxito');
          setCart([]);
          setClientId('');
          setClient({
            id: '',
            client_id: '',
            name: '',
            address: '',
            phone: ''
          });
        } else {
          setTypeMessage("error");
          setError('Error al realizar la venta');
        }
      } else {
        setError('No session token found');
      }
    } catch (err) {
      setTypeMessage("error");
      setError('Error al realizar la venta');
    }

    setBtnAction(false);
  }

  const handletypeOfSaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTypeOfSale(event.target.value);
  };

  return (
    <>
      <div>
        {loading && (
          <div className="spinner-container">
            <Spinner/>  
          </div>              
        )}
      </div>
      <div>
        {showNotification && error && (
            <Notification
              message={error}
              type={typeMessage}
              onClose={() => setShowNotification(false)}
            />
          )}
      </div>
      
      {seller ? (
        
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-card-green shadow-md rounded-lg p-4 col-span-1 sm:col-span-3 md:col-span-3 p-4">
              <div>
                <div className="grid gap-6 mb-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium">
                      CI / Rif:
                    </label>
                    <label htmlFor="clientId" className="mb-2 text-sm font-medium sr-only">Buscar</label>
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
                        className=" text-white bg-primary rounded absolute end-2.5 bottom-2.5 font-medium rounded-lg text-sm px-4 py-2 text-gray"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>
                  <div>
                  </div>
                  <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={client?.name || ''}
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block mb-2 text-sm font-medium">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      id="phone"
                      value={client?.phone || ''}
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label htmlFor="address" className="block mb-2 text-sm font-medium">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5"
                    value={client?.address || ''}
                    readOnly
                  />
                </div>
                <div>
                  <div className="inline-flex rounded-md shadow-sm p-2" role="group">
                    <p className="text-base text-gray-900 dark:text-white"><strong>Vendedor:</strong> {seller.seller || 'No asignado'}</p>
                  </div>
                  <div className="inline-flex rounded-md shadow-sm p-2" role="group">
                    <p className="text-base text-gray-900 dark:text-white"><strong>Caja:</strong> {seller.identifier || 'No asignada'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card-green shadow-md rounded-lg p-4 text-white flex flex-col justify-between">
              <div className="border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 p-4 flex flex-col justify-between flex-grow">
                
                <div>
                  <p><strong>Subtotal:</strong> ${totalAmount.toFixed(2)}</p>
                  <p><strong>IVA (16%):</strong> 20 $</p>
                </div>

                <div className="text-center mt-4">
                  <button
                    onClick={handleSelectTypeSale}
                    className="px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white bg-primary rounded"
                    disabled={!clientId || cart.length === 0 || !!btnAction}
                  >
                    Confirmar Compra
                  </button>
                </div>

              </div>
            </div>

          </div>
          <div className="p-4 mt-4">
            <div className="inline-flex rounded-md shadow-sm text-primary-contrast" role="group">
              <button type="button" onClick={() => setIsModalOpen(true)} className="px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white bg-primary rounded">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                </svg>
                  Agregar Producto
              </button>
            </div>
            
            <hr className='mt-2'/>
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
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(item.productId)}
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
                  onChange={(e) => setSearchTerm(e.target.value)
                  }
                  
                  className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="descripcion del producto" required />
                <button type="submit" className="absolute end-2.5 bottom-2.5 px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white bg-primary rounded">Buscar</button>
              </div>
            </div>
            <div>
              <div>
                <p className="text-lg text-gray-900 dark:text-white">Productos disponibles:</p>
              </div>
              <hr />
              <div className="mt-4 hidden md:block">
                <table className="min-w-full border-collapse border border-gray-300 text-left">
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
                          <td className="px-4 py-2 border border-gray-300">{product.product.final_cost}</td>
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
                              className="px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white bg-primary rounded"
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
            <div className='text-right mt-4'>
            <button onClick={() => setIsModalOpen(false)}
                className="mt-4 p-2 bg-red-500 px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white rounded"
              >
                Cerrar
              </button>
            </div>
          </Modal>
          <Modal title="Confirmar Venta" isOpen={isModalConfirmOpen} onClose={() => setIsModalConfirmOpen(false)}>
            <div className="max-w-md mx-auto">
              <form>
                <div className="mb-4 p-4 bg-gray-100 rounded-lg shadow-md">
                  <p className="text-lg font-semibold mb-4">Seleccione el tipo de venta:</p>
                  <div className="flex flex-row space-x-4">
                    <label htmlFor="normal" className="flex items-center">
                      <input
                        type="radio"
                        id="normal"
                        name="typeOfSale"
                        value="normal"
                        checked={typeOfSale === 'normal'}
                        onChange={handletypeOfSaleChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">De Contado</span>
                    </label>
                    <label htmlFor="credit" className="flex items-center">
                      <input
                        type="radio"
                        id="credit"
                        name="typeOfSale"
                        value="credit"
                        checked={typeOfSale === 'credit'}
                        onChange={handletypeOfSaleChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">Crédito</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleConfirmSale}
                    className="mt-2 p-2 bg-green-500 text-white rounded-lg"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalConfirmOpen(false)}
                    className="mt-2 p-2 bg-red-500 text-white rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      ) : (
        <div>
          <h1>No tiene caja asignada. Consulte al administrador</h1>
        </div>
      )}
    </>
  );
};

export default SalePage;
