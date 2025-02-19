"use client";
import Modal from '@/components/Common/Modal/ModalPage';
import { useEffect, useState } from 'react';
import { registerPop, fetchPopsList, updatePop, deletePop, getUsersByRole, fetchPopStatus, registerPopStatus, deletePopStatus, closePopStatus} from '@/app/api/admin/api';
import { getSession } from 'next-auth/react';
import { Pop} from "@/types/type";
import Spinner from '@/components/Common/Spinner/SpinnerPage';
import Notification from '@/components/Common/Notification/NotificationPage';
import swal from 'sweetalert2';

const PopPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [typeRequest, setTypeRequest] = useState('add');
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [typeMessage, setTypeMessage] = useState('error');
  const [sellerData, setSellerData] = useState<{ 
    id: number; 
    name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    id: '',
    identifier: '',
    ubication: '',
    status: '',
    seller: '',
    date: '',
  });

  useEffect(() => { 
    setShowSpinner(true);
    const fetchPopList = async () => {
     try {
       const session = await getSession();
       const data = await fetchPopsList(session?.user.token as any);
       const sellerData = await getUsersByRole(session?.user.token as any);
       setSellerData(sellerData);
       setPops(data);
     } catch (error) {
       console.error(error);
     }
     finally {
       setShowSpinner(false);  
     }
   }
    fetchPopList();
  }, []);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
          setShowNotification(false);
      }, 10000); // 10 segundos
  
      return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }
  }, [showNotification]);

  useEffect(() => {
    if (typeRequest === 'add') {
      //actualizar formData.status sea igual a "created"
      setFormData({
        ...formData,
        status: 'created' 
      });
    }
  }, [isModalOpen]);
    

    const handleAddPop = async () => {
    try {
      setShowSpinner(true);
      const session = await getSession();
      const response = await registerPop(
        session?.user.token as any, 
        formData.identifier,
        formData.ubication,
        formData.status,
        formData.seller,
      );
      if (response) {
        const newPop: Pop = {
          id: response.id,
          identifier: formData.identifier,
          ubication: formData.ubication,
          status: formData.status,
          updated_at: new Date().toISOString(),
          name: '', // Add appropriate value
          address: '' // Add appropriate value
          ,
          seller: ''
        };
        setPops([...pops, newPop]);
        setShowNotification(true);
        setErrorMessage('Punto de venta registrado correctamente');
        setTypeMessage('success');
      }
    } catch (error) {
      console.error(error);
      setShowNotification(true);
      setErrorMessage((error as any).response.data.message);
      setTypeMessage('error');
    } finally {    
      setIsModalOpen(false);
      setShowSpinner(false);
      setTypeRequest('add');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }

  const handleEditClick = (pop: Pop) => {
    setTypeRequest('edit');
    setIsModalOpen(true);
    formData.id = pop.id.toString();
    formData.identifier = pop.identifier;
    formData.ubication = pop.ubication;
    formData.status = pop.status;
  }
  const handleEditPop = async () => {
    try
    {
      setShowSpinner(true);
      const session = await getSession();
      const response = await updatePop(
        session?.user.token as any, 
        Number(formData.id),
        formData.identifier,
        formData.ubication,
        formData.status,
        formData.seller,
      );
      if (response === 200) {
        setPops(pops.map((pop) => {
          if (pop.id === Number(formData.id)) {
            return {
              ...pop,
              identifier: formData.identifier,
              ubication: formData.ubication
            }
          }
          return pop;
        } ));
        setShowNotification(true);
        setErrorMessage('Punto de venta actualizado correctamente');
        setTypeMessage('success');
      }

    } catch (error) {
      console.error(error);
    }
    finally {    
      setShowSpinner(false);
    }
  }

  const handleDelete = async (id: number) => {
    swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setShowSpinner(true);
          if (formData.status == 'open') {
            setShowNotification(true);
            setErrorMessage('No se puede eliminar un punto de venta abierto');
            setTypeMessage('error');
          }
          else{
            const session = await getSession();
            const response = await deletePop(session?.user.token as any, id);
            if (response === 200) {
              setPops(pops.filter((pop) => pop.id !== id));
              setShowNotification(true);
              setErrorMessage('Punto de venta eliminado correctamente');
              setTypeMessage('success');
            }
          }
          
        } catch (error) {
          console.error(error);
        }
        finally {
          setShowSpinner(false);
        }
      }
    });
  }

  const clearInputs = () => {
    setFormData({
      id: '',
      identifier: '',
      ubication: '',
      status: '',
      seller: '',
      date: '',
    });
  }

  const getStatusBgClass = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-yellow-500';
      case 'open':
        return 'bg-green-500';
      case 'closed':
        return 'bg-red-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleSavePop = async () => {
    if (typeRequest === 'add') {
      handleAddPop();
    } else if (typeRequest === 'edit') {
      handleEditPop();
    } else if (typeRequest === 'open') {
      handleOpenSavePop();
    }
  } 

  const handleOpenClick = async (pop: Pop) => {
    setTypeRequest('open');
    setIsModalOpen(true);
    formData.id = pop.id.toString();
    formData.identifier = pop.identifier;
    formData.ubication = pop.ubication;
    setFormData({
      ...formData,
      status: 'open',
      seller: '',
    });

  }

  const isSellerAssigned = (seller: string) => {
    return pops.some(pop => pop.status === 'open' && pop.seller === seller);
  }; 

  const handleOpenSavePop = async () => {
    try {
      if (isSellerAssigned(formData.seller)) {
        setShowNotification(true);
        setErrorMessage('El vendedor ya tiene un punto de venta asignado');
        setTypeMessage('error');
        return;
      }
      else {
        setShowSpinner(true);
        const session = await getSession();
        const response = await updatePop(
          session?.user.token as any, 
          Number(formData.id),
          formData.identifier,
          formData.ubication,
          formData.status,
          formData.seller,
        );
        if (response === 200) {
          setPops(pops.map((pop) => {
            if (pop.id === Number(formData.id)) {
              return {
                ...pop,
                status: 'open',
                seller: formData.seller
              }
            }
            return pop;
          } ));
          setShowNotification(true);
          setErrorMessage('Punto de venta abierto correctamente');
          setTypeMessage('success');
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setShowSpinner(false);
    } 
  }

    const handleClosePop = async (pop: Pop) => {
    swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setShowSpinner(true);
          const session = await getSession();
          const response = await updatePop(
            session?.user.token as any, 
            pop.id,
            pop.identifier,
            pop.ubication,
            'closed',
            pop.seller = '',
          );
          if (response === 200) {
            setPops(pops.map((p) => {
              if (p.id === pop.id) {
                return {
                  ...p,
                  status: 'closed',
                }
              }
              return p;
            }));
            setShowNotification(true);
            setErrorMessage('Punto de venta cerrado correctamente');
            setTypeMessage('success');
            clearInputs();
          }
        } catch (error) {
          console.error(error);
        } finally {
          setShowSpinner(false);
        }
      }
    });
  }

  return (
    <div>
      <div>
          <div>
            {showSpinner && (
              <div className="spinner-container">
                <Spinner />
              </div>
            )}
          </div>
          <div>
            {showNotification && errorMessage && (
              <Notification
                message={errorMessage}
                type={typeMessage}
                onClose={() => setShowNotification(false)}
              />
            )}
          </div>
          <div className="flex justify-between items-center">
            <h1 className="">Tabla Punto de Ventas</h1>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button 
                id="add_user" 
                type="button" 
                onClick={() => {
                  setIsModalOpen(true);
                  setTypeRequest("add");
                  clearInputs();
                }} 
                className="inline-flex items-center px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full border-collapse border border-gray-300 text-left">
                <thead>
                <tr className="bg-gray-200">
                    <th className="px-4 py-2 border border-gray-300">Identificador</th>
                    <th className="px-4 py-2 border border-gray-300">Ubicación</th>
                    <th className="px-4 py-2 border border-gray-300">Estado</th>
                    <th className="px-4 py-2 border border-gray-300">Vendedor</th>
                    <th className="px-4 py-2 border border-gray-300">Acciones</th>
                </tr>
                </thead>
                <tbody>
                {pops.map((pop) => (
                  <tr key={pop.id} className="bg-white hover:bg-gray-100 transition">
                    <td className="px-4 py-2 border border-gray-300">{pop.identifier}</td>
                    <td className="px-4 py-2 border border-gray-300">{pop.ubication}</td>
                    <td className="px-4 py-2 border border-gray-300">
                      <div className="flex items-center">
                        <div className={`h-2.5 w-2.5 rounded-full ${getStatusBgClass(pop.status)} me-2`} /> {pop.status}
                      </div>
                    </td>
                    <td className="px-4 py-2 border border-gray-300">{pop.seller}</td>
                    <td className="px-4 py-2 border border-gray-300 text-center">
                      
                      <button 
                        onClick={() => handleOpenClick(pop)} 
                        className="ml-2 text-blue-600 hover:underline bg-red-400"
                        disabled={pop.status === 'open' ? true : false}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleClosePop(pop)} 
                        className="ml-2 text-blue-600 hover:underline bg-red-400"
                        disabled={pop.status === 'closed' ? true : false}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>

                      </button>
                      <button 
                        onClick={() => handleEditClick(pop)} 
                        className="ml-2 text-blue-600 hover:underline bg-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>

                      </button>
                      <button 
                        onClick={() => handleDelete(pop.id)} 
                        className="ml-2 text-red-600 hover:underline bg-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                        </svg>


                      </button>
                    </td>
                  </tr>
                ))} 
                </tbody>
            </table>
        </div>      
          <Modal title="Agregar Punto de Venta" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <div className='max-w-md mx-auto'>
              <div className="relative">
                <div>
                  <div className="mb-6">
                    <label htmlFor="identifier" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre o Identificador</label>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      value={formData.identifier}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border py-1.5 text-gray-900"
                      disabled={typeRequest === 'open' ? true : false}
                    />
                  </div>
                  <div className="mb-6">
                    <label htmlFor="ubication" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Ubicación</label>
                    <input 
                      type="text" 
                      id="ubication"
                      name='ubication'
                      value={formData.ubication}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                      disabled={typeRequest === 'open' ? true : false}
                    />
                  </div>
                  <div className='mb-6'>
                      <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Estado del Punto de Venta</label>
                      <input 
                        type="text" 
                        id="status"
                        name='status'
                        value={formData.status}
                        disabled
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                      />
                    
                    </div>
                  {typeRequest === 'open' && (
                    <div className="mb-6">
                      <label htmlFor="seller" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre del Vendedor</label>
                      <select
                        id="seller"
                        name="seller"
                        value={formData.seller}
                        onChange={handleChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        required
                        >
                          <option value="">
                            Selecciona un Vendedor
                          </option>
                        {sellerData.map((seller) => (
                          <option key={seller.id} value={seller.name}>{seller.name}</option>
                        ))}
                      </select>
                    </div>
                   )}
                  <button 
                    onClick={handleSavePop}
                    className="w-full p-2 bg-blue-500 text-white rounded-lg"
                  >
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        </div>
    </div>
  );
}

export default PopPage;