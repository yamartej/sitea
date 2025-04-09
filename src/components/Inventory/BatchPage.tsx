"use client"
import Spinner from "../Common/Spinner/SpinnerPage";
import React, { useEffect, useState } from "react";
import { Batch } from "@/types/type";
import { getSession } from "next-auth/react";
import { fetchBatchesList, registerBatch, deleteBatch, updateBatch } from "@/app/api/admin/api";
import Modal from "../Common/Modal/ModalPage";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Notification from "../Common/Notification/NotificationPage";
import Swal from "sweetalert2";

const BatchPage = () => {
    const [showSpinner, setShowSpinner] = useState(false);
    const [batchs, setBatchs] = useState<Batch[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        quantity: "",
        order_creation_date: new Date(),
    });
    const [showNotification, setShowNotification] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [typeMessage, setTypeMessage] = useState('success');
    const [isEditing, setIsEditing] = useState(false); // Nuevo estado
    const [editingBatchId, setEditingBatchId] = useState<number | null>(null); // ID del lote en edición

    useEffect(() => {
        const fetchBatch = async () => {
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const response = await fetchBatchesList(session?.user.token as string); 
                setBatchs(response);
            }
            catch (error) {
                console.error("Error fetching batch data:", error);
            }
            finally {
                setShowSpinner(false);
            }
        }
        fetchBatch();
    }, []);

    useEffect(() => {
        if (showNotification) {
          const timer = setTimeout(() => {
              setShowNotification(false);
          }, 10000); // 10 segundos
      
          return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
        }
      }, [showNotification]);
    
    const handleAddBatchClick = () => {
        setIsModalOpen(true);
        
    };
    
    const handleEditClick = (batch: Batch) => {
        setFormData({
            name: batch.name,
            description: batch.description,
            quantity: String(batch.quantity),
            order_creation_date: new Date(batch.order_creation_date),
        });
        setEditingBatchId(batch.id); // Guardar el ID del lote en edición
        setIsEditing(true); // Cambiar a modo edición
        setIsModalOpen(true); // Abrir el modal
    };

    const handleDelete = async (id: number) => {
        Swal.fire({
            title: '¿Estás seguro de que deseas eliminar este lote?',
            text: "No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const session = await getSession();
                const response = await deleteBatch(session?.user.token as any, id);
                if (response === 200) {
                    setShowNotification(true);
                    setErrorMessage('Punto de venta eliminado correctamente');
                    setTypeMessage('success');
                    setBatchs((prevBatch) => prevBatch.filter((batch) => batch.id !== id));
                } else {
                    setShowNotification(true);
                    setErrorMessage('Error al eliminar el punto de venta');
                    setTypeMessage('error');
                }
            }
        })
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

        const handleSaveBatch = async () => {
        setShowSpinner(true);
        const session = await getSession(); 
        try {
            if (isEditing && editingBatchId !== null) {
                // Actualizar lote existente
                const response = await updateBatch(
                    session?.user.token as string,
                    editingBatchId,
                    formData.name,
                    formData.description,
                    parseInt(formData.quantity, 10),
                    format(formData.order_creation_date, "yyyy-MM-dd"),
                    
                );
                if (response) {
                    setBatchs((prevBatch) =>
                        prevBatch.map((batch) =>
                            batch.id === editingBatchId
                                ? {
                                      ...batch,
                                      name: formData.name,
                                      description: formData.description,
                                      quantity: parseInt(formData.quantity, 10),
                                      order_creation_date: format(formData.order_creation_date, "yyyy-MM-dd"),
                                  }
                                : batch
                        )
                    );
                    setShowNotification(true);
                    setErrorMessage("Lote actualizado correctamente");
                    setTypeMessage("success");
                }
            } else {
                // Crear nuevo lote
                const response = await registerBatch(
                    session?.user.token as string,
                    formData.name,
                    formData.description,
                    parseInt(formData.quantity, 10),
                    format(formData.order_creation_date, "yyyy-MM-dd")
                );
                if (response) {
                    setBatchs((prevBatch) => [
                        ...prevBatch,
                        {
                            id: response.id,
                            name: formData.name,
                            description: formData.description,
                            quantity: parseInt(formData.quantity, 10),
                            order_creation_date: format(formData.order_creation_date, "yyyy-MM-dd"),
                        },
                    ]);
                    setShowNotification(true);
                    setErrorMessage("Lote creado correctamente");
                    setTypeMessage("success");
                }
            }
            handleSetInputs(true); // Limpiar los campos del formulario
        } catch (error) {
            console.error("Error al guardar el lote:", error);
            setShowNotification(true);
            const errorMessage = (error as any)?.response?.data?.message || "Error desconocido";
            setErrorMessage(`${errorMessage}`);
            setTypeMessage("error");
        } finally {
            setShowSpinner(false);
            setIsModalOpen(false);
            setIsEditing(false); // Restablecer el modo edición
            setEditingBatchId(null); // Limpiar el ID del lote en edición
        }
    };

    const handleDateChange = (date: Date | null) => {
        if (date) {
            setFormData((prevData) => ({
                ...prevData,
                order_creation_date: date, // Actualizar la fecha seleccionada
            }));
        }
    };

    const handleSetInputs = (status: boolean) => {
        if (status) {
            setFormData({
                name: "",
                description: "",
                quantity: "",
                order_creation_date: new Date(),
            });
        }
    };


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
        <div>
            <div className="flex justify-between items-center">
                <h1 className="">Tabla Lotes</h1>
                <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button  id="add_user" type="button" onClick={handleAddBatchClick} className="inline-flex items-center px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full border-collapse border border-gray-300 text-left">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="px-4 py-2 border border-gray-300">Nombre</th>
                        <th className="px-4 py-2 border border-gray-300">Descripción</th>
                        <th className="px-4 py-2 border border-gray-300">Cantidad</th>
                        <th className="px-4 py-2 border border-gray-300">Fecha de Orden</th>
                        <th className="px-4 py-2 border border-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {batchs?.map((batch) => (
                        <tr  key={batch.id} className="bg-white hover:bg-gray-100 transition">
                            <td className="px-4 py-2 border border-gray-300">{batch.name}</td>
                            <td className="px-4 py-2 border border-gray-300">{batch.description}</td>
                            <td className="px-4 py-2 border border-gray-300">{batch.quantity}</td>
                            <td className="px-4 py-2 border border-gray-300">
                                {format(new Date(batch.order_creation_date), "dd-MM-yyyy")} {/* Formatear la fecha */}
                            </td>
                            <td className="px-4 py-2 border border-gray-300 text-center">
                                <button className="text-blue-600 hover:underline"
                                    onClick={() => handleEditClick(batch)}
                                    >Editar</button>
                                <button
                                    className="ml-2 text-red-600 hover:underline"
                                    onClick={() => handleDelete(batch.id)}
                                    >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <Modal 
            title={isEditing ? "Editar Lote" : "Agregar Lote"} // Cambiar el título dinámicamente
            isOpen={isModalOpen}
            onClose={() => {
                setIsModalOpen(false);
                setIsEditing(false); // Restablecer el modo edición al cerrar
                setEditingBatchId(null); // Limpiar el ID del lote en edición
            }}
            >
            <div className='max-w-md mx-auto'>
                <div className="relative">
                    <div className="mb-6">
                        <label htmlFor="name" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre Lote</label>
                        <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="block w-full rounded-md border py-1.5 text-gray-900"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Descripción</label>
                        <input 
                        type="text" 
                        id="description"
                        name='description'
                        value={formData.description}
                        onChange={handleChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                        />
                    </div>
                    <div className='mb-6'>
                        <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Cantidad</label>
                        <input 
                            type="text" 
                            id="quantity"
                            name='quantity'
                            value={formData.quantity}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                        />
                    </div>
                    <div className='mb-6'>
                        <label htmlFor="order_creation_date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fecha de Orden</label>
                        <ReactDatePicker
                            selected={formData.order_creation_date}
                            onChange={handleDateChange}
                            dateFormat="dd- MM-yyyy"
                            locale={es}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                        
                    </div>
                    <button 
                        onClick={handleSaveBatch}
                        className="w-full p-2 bg-blue-500 text-white rounded-lg"
                    >
                        <span>Guardar</span>
                    </button>
                    
                </div>
            </div>
          </Modal>
    </div>
  );
}

export default BatchPage;