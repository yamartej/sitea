"use client";
import Modal from '@/components/Common/Modal/ModalPage';
import { useEffect, useState } from 'react';
import { registerPop, fetchPopsList, updatePop, deletePop } from '@/app/api/admin/api';
import { getSession } from 'next-auth/react';
import { Pop} from "@/types/type";
import Spinner from '@/components/Common/Spinner/SpinnerPage';
import Notification from '@/components/Common/Notification/NotificationPage';
import GenericTable from '@/components/Common/Table/GenericTable';


const PopPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [typeRequest, setTypeRequest] = useState('add');
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [typeMessage, setTypeMessage] = useState('error');
  const [formData, setFormData] = useState({
    id: '',
    identifier: '',
    ubication: ''
  });

  const columns = [
    { header: 'Identificador', accessor: 'identifier' },
    { header: 'Ubicación', accessor: 'ubication' },
  ];

  useEffect(() => { 
    setShowSpinner(true);
    const fetchPopList = async () => {
     try {
       const session = await getSession();
       const data = await fetchPopsList(session?.user.token as any);
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
    

    const handleAddPop = async () => {
    try {
      setShowSpinner(true);
      const session = await getSession();
      const response = await registerPop(
        session?.user.token as any, 
        formData.identifier,
        formData.ubication
      );
      if (response) {
        const newPop: Pop = {
          id: response.id,
          identifier: formData.identifier,
          ubication: formData.ubication,
          name: '', // Add appropriate value
          address: '' // Add appropriate value
        };
        setPops([...pops, newPop]);
        setShowNotification(true);
        setErrorMessage('Punto de venta registrado correctamente');
        setTypeMessage('success');
      }
    } catch (error) {
      console.error(error);
    } finally {    
      setIsModalOpen(false);
      setShowSpinner(false);
      setTypeRequest('add');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        formData.ubication
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
    try {
      setShowSpinner(true);
      const session = await getSession();
      const response = await deletePop(session?.user.token as any, id);
      if (response === 200) {
        setPops(pops.filter((pop) => pop.id !== id));
        setShowNotification(true);
        setErrorMessage('Punto de venta eliminado correctamente');
        setTypeMessage('success');
      }
    } catch (error) {
      console.error(error);
    }
    finally {
      setShowSpinner(false);
    }
  }

  const clearInputs = () => {
    setFormData({
      id: '',
      identifier: '',
      ubication: ''
    });
  }
  
  return (
      <div>
        <div>
        {showSpinner && (
            <div className="spinner-container">
                <Spinner/>  
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
        <GenericTable
        columns={columns}
        data={pops}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />
      
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
                  />
                </div>
                <button 
                  onClick={typeRequest === 'add' ? handleAddPop : handleEditPop} 
                  className="w-full p-2 bg-blue-500 text-white rounded-lg"
                >
                  <span>{typeRequest === 'add' ? 'Guardar' : 'Actualizar'}</span>
                </button>
                

              </div>
            </div>
        </div>
      </Modal>
    </div>
  );
}

export default PopPage;
