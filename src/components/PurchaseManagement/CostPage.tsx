"use client"
import Spinner from '../Common/Spinner/SpinnerPage';
import React, { use, useEffect, useState } from 'react';
import Notification from '../Common/Notification/NotificationPage';
import Modal from '../Common/Modal/ModalPage';
import { getSession } from 'next-auth/react';
import { fetchBatchesList, fetchCostsList, registerCost, removeCost, updateCost} from '@/app/api/purchase/api'; // Asegúrate de que la ruta sea correcta
import { Batch, Cost, Company } from '@/types/type';
import Swal from 'sweetalert2';
import { useTable, usePagination, Column, useSortBy } from 'react-table';
import InfoCardGrid from "../Common/Card/InfoCardGrid";
import Costs from '@/app/pages/costs/page';
import { fetchCompaniesList } from '@/app/api/admin/api';



const CostPage = () => {
    
    const [costs, setCosts] = useState<Cost[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
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
            const token = session?.user.token as string;
            const ownCompanyId = session?.user.company_id || null;

            setCompanyId(ownCompanyId);

            try {
                if (ownCompanyId) {
                    const response = await fetchCostsList(token, ownCompanyId);
                    const dataBatches = await fetchBatchesList(token, ownCompanyId);
                    setCosts(response);
                    setBatches(dataBatches);
                } else {
                    const companyData = await fetchCompaniesList(token);
                    setCompanies(companyData);
                    setCosts([]);
                    setBatches([]);
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

        fetchCosts();
    }, []);

    const activeCompanyId = companyId || selectedCompanyId || null;

    const isWritableCompanyRecord = (
        recordCompanyId: string | number | null | undefined
    ) =>
        Boolean(activeCompanyId) &&
        String(recordCompanyId) === String(activeCompanyId);

    const handleCompanyChange = async (        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const nextCompanyId = e.target.value;
        setSelectedCompanyId(nextCompanyId);
        setIsModalOpen(false);
        setIsEditing(false);
        setEditingCostId(null);

        if (!nextCompanyId) {
            setCosts([]);
            setBatches([]);
            return;
        }

        const session = await getSession();
        try {
            setShowSpinner(true);
            const token = session?.user.token as string;
            const response = await fetchCostsList(token, nextCompanyId);
            const dataBatches = await fetchBatchesList(token, nextCompanyId);
            setCosts(response);
            setBatches(dataBatches);
        } catch (error : any) {
            console.error('Error fetching company costs:', error);
            setErrorMessage(error.message || 'Error cargando costos de la empresa');
            setTypeMessage('error');
            setShowNotification(true);
        } finally {
            setShowSpinner(false);
        }
    };

    useEffect(() => {
        if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 10000); // 10 segundos
            return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
        }
    }, [showNotification]);

    const columns: Column<Cost>[] = React.useMemo(
        () => [
            {
                Header: 'Lote',
                accessor: (row) => row.batch?.name || 'N/A', // Acceder al nombre del lote de forma segura
            },
            {
                Header: 'Monto',
                accessor: 'amount',
                Cell: ({ value }) => value, // Convertir el monto a cadena antes de formatear
            },
            {
                Header: 'Descripción',
                accessor: 'description',
            },
            {
                Header: 'Acciones',
                Cell: ({ row }) => (
                    <div className="flex gap-x-2">
                        <button
                            className="text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => handleEditCost(row.original)}
                            disabled={!isWritableCompanyRecord(row.original.batch?.company_id)}
                            title={
                                isWritableCompanyRecord(row.original.batch?.company_id)
                                    ? "Editar costo"
                                    : "Registro legacy de solo lectura"
                            }
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                            </svg>
                        </button>
                        <button
                            className="text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => handleRemoveCost(row.original.id)}
                            disabled={!isWritableCompanyRecord(row.original.batch?.company_id)}
                            title={
                                isWritableCompanyRecord(row.original.batch?.company_id)
                                    ? "Eliminar costo"
                                    : "Registro legacy de solo lectura"
                            }                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ),
            },
        ],
        [costs]
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        page, // Filas de la página actual
        canPreviousPage,
        canNextPage,
        pageOptions,
        nextPage,
        previousPage,
        state: { pageIndex, pageSize },
        setPageSize,
    } = useTable(
        {
            columns,
            data: costs,
            initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
        },
        useSortBy, // Agregar el plugin de ordenación
        usePagination // Agregar el plugin de paginación
    );

    
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
        if (!activeCompanyId) {
            setErrorMessage("Selecciona una empresa antes de guardar");
            setTypeMessage("error");
            setShowNotification(true);
            setShowSpinner(false);
            return;
        }
        try {
            if (isEditing && editingCostId) {
                const response = await updateCost(
                    session?.user.token as string, 
                    editingCostId, 
                    Number(formData.amount), 
                    Number(formData.batch_id), 
                    formData.description,
                activeCompanyId
                ); 
                if(response){
                    setCosts((prevCosts) =>
                        prevCosts.map((cost) => 
                            cost.id === editingCostId ? {
                                ...cost,
                                //el monto es decimal en la base de datos. Quiero que sea igual al que se muestra en la tabla
                                amount: parseAmount(formData.amount), // Convertir el monto a número
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
                const response = await registerCost(session?.user.token as string, Number(formData.amount), formData.batch_id, formData.description, activeCompanyId);
                if(response){
                    // Actualizar la lista de costos después de agregar uno
                    setCosts((prevCosts) => [
                        ...prevCosts, 
                        {
                            ...response,
                            amount: parseFloat(formData.amount.replace(',', '.')), // Convertir a número 
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
        const cost = costs.find((item) => item.id === id);
        if (!cost || !isWritableCompanyRecord(cost.batch?.company_id)) {
            setErrorMessage("Este costo legacy es de solo lectura");
            setTypeMessage("error");
            setShowNotification(true);
            return;
        }

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
            if (!activeCompanyId) {
                setErrorMessage('Selecciona una empresa antes de eliminar');
                setTypeMessage('error');
                setShowNotification(true);
                setShowSpinner(false);
                return;
            }
            try {
                const response = await removeCost(
                    session?.user.token as string,
                    id,
                    activeCompanyId
                );
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
        if (!isWritableCompanyRecord(cost.batch?.company_id)) {
            setErrorMessage("Este costo legacy es de solo lectura");
            setTypeMessage("error");
            setShowNotification(true);
            return;
        }

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

    const totalAmount = costs.reduce((total, cost) => total + (Number(cost.amount) || 0), 0).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

    const cards = [
        { title: "Total en $", value: totalAmount },
      ];


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
                <InfoCardGrid cards={cards}/>
            </div>

            {!companyId && (
                <div className="mt-4 text-primary-contrast">
                    <label
                        htmlFor="cost_company_id"
                        className="block mb-2 text-sm font-medium"
                    >
                        Empresa
                    </label>
                    <select
                        id="cost_company_id"
                        value={selectedCompanyId}
                        onChange={handleCompanyChange}
                        className="border rounded p-2 w-full md:w-80"
                    >
                        <option value="">Selecciona una empresa</option>
                        {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <div className="flex justify-between items-center mt-4 text-xs text-primary-contrast">
                    <div className="">
                        <label htmlFor="pageSize" className="mr-2">Filas por página:</label>
                        <select
                            id="pageSize"
                            value={pageSize}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                setPageSize(value);
                            }}
                            className="border rounded p-1"
                        >
                            {[5, 10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button id="add_user" type="button" onClick={() => {
                            handleAddCost();
                            }}
                            disabled={!activeCompanyId}
                            title={!activeCompanyId ? "Selecciona una empresa" : "Agregar costo"}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary disabled:opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto hidden md:block">
                <table
                {...getTableProps()}
                className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase border-b border-t">
                        {headerGroups.map((headerGroup) => {
                            const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
                            return (
                                <tr key={key} {...restHeaderGroupProps}>
                                    {headerGroup.headers.map((column) => {
                                        const { key: columnKey, ...restColumnProps } = column.getHeaderProps(
                                            column.getSortByToggleProps()
                                            );
                                            return (
                                                <th
                                                    key={columnKey}
                                                    {...restColumnProps}
                                                    className="px-4 py-2 cursor-pointer border-t border-b border-gray-200"
                                                >
                                                    {column.render("Header")}
                                                    {column.canSort && (
                                                        <span>

                                                            {column.isSorted
                                                            ? column.isSortedDesc
                                                            ? " ↓"
                                                            : " ↑"
                                                            : " ↓↑"
                                                            }
                                                        </span>
                                                    )}
                                                </th>
                                            );
                                        })}
                                </tr>
                            );
                        })}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {page.map((row) => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()} className="odd:bg-white bg-gray-100 hover:bg-gray-100 transition">
                                    {row.cells.map((cell) => (
                                        <td {...cell.getCellProps()} className="px-4 py-2">
                                            {cell.render('Cell')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
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
                            <button
                                onClick={() => handleEditCost(cost)}
                                disabled={!isWritableCompanyRecord(cost.batch?.company_id)}
                                title={
                                    isWritableCompanyRecord(cost.batch?.company_id)
                                        ? "Editar costo"
                                        : "Registro legacy de solo lectura"
                                }
                                className="text-blue-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => handleRemoveCost(cost.id)}
                                disabled={!isWritableCompanyRecord(cost.batch?.company_id)}
                                title={
                                    isWritableCompanyRecord(cost.batch?.company_id)
                                        ? "Eliminar costo"
                                        : "Registro legacy de solo lectura"
                                }
                                className="text-red-600 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                            >
                                Eliminar
                            </button>                        </div>
                    </div>
                ))}
            </div>

            <div className="text-right mt-4 text-xs text-gray-700 dark:text-gray-400 border-t border-gray-200 pt-2">
                <button
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                        <path fillRule="evenodd" d="M4.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L6.31 10l3.72-3.72a.75.75 0 1 0-1.06-1.06L4.72 9.47Zm9.25-4.25L9.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L11.31 10l3.72-3.72a.75.75 0 0 0-1.06-1.06Z" clipRule="evenodd" />
                    </svg>
                </button>

                <span className="mx-2">
                    Página{' '}
                    <strong>
                        {pageIndex + 1} de {pageOptions.length}
                    </strong>
                </span>

                <button
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                        <path fillRule="evenodd" d="M15.28 9.47a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L13.69 10 9.97 6.28a.75.75 0 0 1 1.06-1.06l4.25 4.25ZM6.03 5.22l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L8.69 10 4.97 6.28a.75.75 0 0 1 1.06-1.06Z" clipRule="evenodd" />
                    </svg>
                </button>
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
                    <div className="grid gap-6 mb-6 md:grid-cols-2 text-primary-contrast">
                        <div>
                            <label htmlFor="batch_id" className="block mb-2 text-sm font-medium">Nombre del Lote</label>
                            <select
                                id="batch_id"
                                name="batch_id"
                                value={formData.batch_id}
                                onChange={handleInputChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                required
                            >
                                <option value="">
                                    Selecciona un Lote
                                </option>
                                {batches?.filter((item) => isWritableCompanyRecord(item.company_id)).map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} - {item.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block mb-2 text-sm font-medium">Monto</label>
                            <input
                                type="text"
                                id="amount"
                                name="amount"
                                value={formData.amount} // Mostrar el valor sin formatear mientras el usuario escribe
                                onChange={handleInputChange} // Usar la nueva función para manejar la entrada
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block mb-2 text-sm font-medium">Descripción</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full p-2 bg-primary rounded-lg"
                    >
                        <span>Guardar</span>
                    </button>
                </form>
            </Modal>
        </div>
    );
}

export default CostPage;