"use client"
import Spinner from '../Common/Spinner/SpinnerPage';
import { use, useEffect, useState } from 'react';
import Notification from '../Common/Notification/NotificationPage';
import Modal from '../Common/Modal/ModalPage';
import { getSession } from 'next-auth/react';
import { fetchBatchesList, fetchCostsList, registerCost, removeCost, updateCost} from '@/app/api/purchase/api'; // Asegúrate de que la ruta sea correcta
import { Batch, Cost } from '@/types/type';
import Swal from 'sweetalert2';

const CostPage = () => {
    
    const [costs, setCosts] = useState<Cost[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [showSpinner, setShowSpinner] = useState(true);
    const [showNotification, setShowNotification] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [typeMessage, setTypeMessage] = useState('error');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCostId, setEditingCostId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        batch: '',
        batch_id: 0,
    });

    useEffect(() => {
        const fetchCosts = async () => {
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const response = await fetchCostsList(session?.user.token as string); 
                const dataBatches = await fetchBatchesList(session?.user.token as string);
                setCosts(response);
                setBatches(dataBatches);
            } catch (error : any) {
                console.error('Error fetching costs:', error);
                setErrorMessage(error.message);
                setTypeMessage('error');
                setShowNotification(true);
            } finally {
                setShowSpinner(false);
            }
        };

        fetchCosts();
    }
    , []);

    useEffect(() => {
        if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 10000); // 10 segundos
            return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
        }
    }, [showNotification]);

    
    const handleAddCost = () => {
        setIsModalOpen(true);
        setIsEditing(false);
        setFormData({
            amount: '',
            description: '',
            batch: '',
            batch_id: 0,
        });
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };  

    // Removed duplicate formatCurrency function to avoid redeclaration error

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
    
        // Permitir solo números, comas y puntos
        const formattedValue = value.replace(/[^0-9.,]/g, '');
    
        setFormData((prevData) => ({
            ...prevData,
            amount: formattedValue, // Guardar el valor como texto
        }));
    };
    
    const parseAmount = (value: string): number => {
        // Convertir el valor formateado a un número
        return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    };
    
    const formatCurrency = (value: string): string => {
        // Formatear el valor como moneda
        const numericValue = parseAmount(value);
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericValue);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setShowSpinner(true);
        const session = await getSession();
        try {
            if (isEditing && editingCostId) {
                const response = await updateCost(
                    session?.user.token as string, 
                    editingCostId, 
                    parseAmount(formData.amount), 
                    Number(formData.batch_id), 
                    formData.description
                ); 
                if(response){
                    setCosts((prevCosts) =>
                        prevCosts.map((cost) => 
                            cost.id === editingCostId ? {
                                ...cost,
                                amount: Number(formData.amount),
                                batch_id: Number(formData.batch_id),
                                batch: batches.find(batch => batch.id === Number(formData.batch_id)) || null, // Obtener el lote correspondiente
                                description: formData.description,
                            } : cost
                        )
                    );
                    setShowNotification(true);
                    setErrorMessage('Costo actualizado exitosamente');
                    setTypeMessage('success');
                }
                setIsModalOpen(false);
                setIsEditing(false); // Restablecer el modo edición
            } else {
                const response = await registerCost(session?.user.token as string, parseAmount(formData.amount), formData.batch_id, formData.description); 
                if(response){
                    // Actualizar la lista de costos después de agregar uno
                    setCosts((prevCosts) => [
                        ...prevCosts, 
                        {
                            ...response,
                            amount: formData.amount, 
                            batch_id: formData.batch_id,
                            batch: batches.find(batch => batch.id === Number(formData.batch_id)) || null, // Obtener el lote correspondiente
                            description: formData.description,
                        },
                    ]);
                    setShowNotification(true);
                    setErrorMessage('Costo registrado exitosamente');
                    setTypeMessage('success');
                }
                setIsModalOpen(false);
                setIsEditing(false); // Restablecer el modo edición
            }
        } catch (error : any) {
            console.error('Error fetching costs:', error);
            setErrorMessage(error.message);
            setTypeMessage('error');
            setShowNotification(true);
        } finally {
            setShowSpinner(false);
        }
    };

    const handleRemoveCost = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo!'
        });
        if (result.isConfirmed) {
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const response = await removeCost(session?.user.token as string, id); 
                if(response){
                    // Actualizar la lista de costos después de eliminar uno
                    const updatedCosts = costs.filter(cost => cost.id !== id);
                    setCosts(updatedCosts);
                    setShowNotification(true);
                    setErrorMessage('Costo eliminado exitosamente');
                    setTypeMessage('success');
                }
            } catch (error : any) {
                console.error('Error fetching costs:', error);
                setErrorMessage(error.message);
                setTypeMessage('error');
                setShowNotification(true);
            } finally {
                setShowSpinner(false);
            }
        }
    };

    const handleEditCost = (cost: Cost) => {
        setFormData({
            amount: Number(cost.amount).toString(), // Convertir a string para el input
            description: cost.description,
            batch: cost.batch?.name || '', // Add batch name or default to an empty string
            batch_id: cost.batch_id,
        });
        setEditingCostId(cost.id); // Guardar el ID del costo que se está editando
        setIsEditing(true); // Cambiar a modo edición
        setIsModalOpen(true);
        setIsEditing(true);
    }
    return (
        <div>
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
                    <h1 className="">Tabla Costos</h1>
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button type="button" onClick={handleAddCost} className="inline-flex items-center px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Lote</th>
                            <th scope="col" className="px-6 py-3">Monto</th>
                            <th scope="col" className="px-6 py-3">Descripción</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!showSpinner && costs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-4">No hay costos registrados</td>
                            </tr>
                        )}
                        {costs?.map((cost) => (
                            <tr key={cost.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{cost.batch?.name || 'N/A'}</td>
                                <td className="px-6 py-4">{cost.amount}</td>
                                <td className="px-6 py-4">{cost.description}</td>
                                <td className="px-6 py-4 flex gap-x-2">
                                    <button type="button" onClick={() => handleEditCost(cost)} className="font-medium text-blue-600 hover:underline">Editar</button>    
                                    <button type="button" onClick={() => handleRemoveCost(cost.id)} className="font-medium text-red-600 hover:underline">Eliminar</button>

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="block md:hidden mt-2 space-y-4">
                {costs?.map((cost) => (
                    <div key={cost.id} className="p-4 bg-white rounded-lg shadow border border-gray-300">
                        <p>
                            <span className="font-semibold">Lote:</span> {cost.batch?.name || 'N/A'}</p>
                        <p>
                            <span className="font-semibold">Monto:</span> {cost.amount}</p>
                        <p>
                            <span className="font-semibold">Descripción:</span> {cost.description}</p>
                        <div className="mt-2 flex justify-end space-x-2">
                            <button onClick={() => handleEditCost(cost)} className="text-blue-600 hover:underline">Editar</button>
                            <button onClick={() => handleRemoveCost(cost.id)} className="text-red-600 hover:underline">Eliminar</button>
                        </div>
                    </div>))}
                </div>
            <Modal
                title={isEditing ? "Editar Costo" : "Agregar Costo"}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsEditing(false); // Restablecer el modo edición al cerrar
                }}
            >
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 mb-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="batch_id" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre del Lote</label>
                            <select
                                id="batch_id"
                                name="batch_id"
                                value={formData.batch_id}
                                onChange={handleInputChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                required
                            >
                                <option value="">
                                    Selecciona un Lote
                                </option>
                                {batches?.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} - {item.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Monto</label>
                            <input
                                type="text"
                                id="amount"
                                name="amount"
                                value={formData.amount} // Mostrar el valor sin formatear mientras el usuario escribe
                                onChange={handleInputChange} // Usar la nueva función para manejar la entrada
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Descripción</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full p-2 bg-blue-500 text-white rounded-lg"
                    >
                        <span>Guardar</span>
                    </button>
                </form>
            </Modal>
        </div>
    );
}

export default CostPage;