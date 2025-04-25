"use client"
import { useEffect, useState } from "react"; 
import { fetchProductsList, fetchCategoriesList, registerProduct, updateProduct, deleteProduct} from "@/app/api/admin/api";
import { fetchBatchesList } from "@/app/api/purchase/api";
import { getSession } from 'next-auth/react';
import { Batch, Category, Product } from "@/types/type";
import Notification from "../Common/Notification/NotificationPage";
import Spinner from "../Common/Spinner/SpinnerPage";
import Swal from "sweetalert2";
import React from "react";
import { useTable, usePagination, Column, useSortBy } from 'react-table';
import Modal from "../Common/Modal/ModalPage";
import InfoCardGrid from "../Common/Card/InfoCardGrid";


const ProductPage = () =>{
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showRegister, setShowRegister] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [btnAction, setBtnAction] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [typeMessage, setTypeMessage] = useState("error");
    const [typeRequest, setTypeRequest] = useState("create");
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        price: "",
        category: "",
        quantity: "",
        batch: "",
      });    
    const [errors, setErrors] = useState<{
        priceMessage: string | null;
      }>({
        priceMessage: null,
      });
    const [batches, setBatches] = useState<Batch[]>([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpenBatch, setIsModalOpenBatch] = useState(false);
    
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    
    const handleSelectProduct = (id: number) => {
      setSelectedProducts((prevSelected) =>
        prevSelected.includes(id)
          ? prevSelected.filter((productId) => productId !== id)
          : [...prevSelected, id]
      );
    };
    
    const handleSelectAll = () => {
      if (selectedProducts.length === products.length) {
        setSelectedProducts([]); // Deseleccionar todos
      } else {
        setSelectedProducts(products.map((product) => product.id)); // Seleccionar todos
      }
    };

    const columns: Column<Product>[] = React.useMemo(
        () => [
            
            {
                id: "selection",
                Header: ({ getToggleAllRowsSelectedProps }) => (
                    <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={handleSelectAll}
                    />
                ),
                Cell: ({ row }) => (
                    <input
                    type="checkbox"
                    checked={selectedProducts.includes(row.original.id)}
                    onChange={() => handleSelectProduct(row.original.id)}
                    />
                ),
            },
            {
                Header: 'Nombre',
                accessor: 'name',
            },            
            {
                Header: 'Descripción',
                accessor: 'description',
            },
            {
                Header: 'Precio',
                accessor: 'price',
            },
            {
                Header: 'Categoría',
                accessor: (row) => row.category?.name || 'Sin categoría',
            },
            {
                Header: 'Cantidad',
                accessor: 'quantity',
            },
            {
              Header: 'Lote',
              accessor: (row) => (
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    row.batches?.name
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800' 
                  }`}
                >
                  {row.batches?.name || 'Sin lote'}
                </span>
              ),
            },
            {
                Header: 'Acciones',
                Cell: ({ row }) => (
                    <div className="flex justify-center space-x-2">
                        <button title="Editar Producto" onClick={() => handleEditClick(row.original)} 
                            className="text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                    <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                    <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                </svg>
                        </button>
                        
                        <button title="Eliminar Producto" onClick={() => handleDelete(row.original.id)} 
                            className="text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                                </svg>
                        </button>
                    </div>
                ),
            },
        ],
        [selectedProducts, products]
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
            data: products,
            initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
        },
        useSortBy, // Agregar el plugin de ordenación
        usePagination // Agregar el plugin de paginación
    );
    
    useEffect(() => { 
        setShowSpinner(true);
        const fetchProducts  = async () => { 
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const data = await fetchProductsList(session?.user.token as string);
                const dataCategories = await fetchCategoriesList(session?.user.token as string);
                const dataBatches = await fetchBatchesList(session?.user.token as string);

                setProducts(data); 
                setCategories(dataCategories); 
                setBatches(dataBatches);
              } catch (error) {
                console.error("Error fetching:", error);
                setErrorMessage("Error fetching");
                setShowNotification(true);
              }
              finally{
                setShowSpinner(false);
                if (showNotification) {
                const timer = setTimeout(() => {
                    setShowNotification(false);
                }, 10000); // 10 segundos
            
                return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
                }
              }
        }; 
        fetchProducts (); 
    }, []);
    
    const handleAddCategoryClick = () => {
        setShowRegister(true);
        setTypeRequest("create");
        cleanInputs();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
        const { name, value } = e.target; 
        setFormData({ 
            ...formData, 
            [name]: value 
        });

        // Validación en tiempo real de las contraseñas
        if (name === "price") {
            const regex = /^[0-9]*\.?[0-9]*$/; 
            if (regex.test(value)) { 
                setFormData({ ...formData, [name]: value, });
                setBtnAction(false);
            }
            else{
                setErrorMessage("Validar Precio");
                setShowNotification(true);
                setBtnAction(true);
            }
        }
    };
    

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (errors.priceMessage) {
            setErrorMessage("Validar Precio");
            setShowNotification(true);
            return;
          } 
          else {
            setErrors({ ...errors, priceMessage: null });
          }
        try {
            setShowSpinner(true);
            setIsModalOpen(false);
            const session = await getSession();
            if(typeRequest === "create"){
                const response = await registerProduct(
                session?.user.token as any,
                formData.name,
                formData.description,
                Number(formData.price),
                Number(formData.category),
                Number(formData.quantity),
                formData.batch,
                );
                if (response && response.product.id) {
                    // Buscar el nombre de la categoría correspondiente
                    const category = categories.find((category) => category.id === Number(formData.category));
                    const batch = batches.find((batch) => batch.id === Number(formData.batch));
                                            
                    // Agregar el nuevo producto al estado
                    setProducts((prevProducts) => [
                        ...prevProducts,
                        {
                            id: response.product.id, // Asegúrate de que este valor sea válido
                            name: response.product.name,
                            description: response.product.description,
                            price: response.product.price,
                            quantity: response.product.quantity,
                            category_id: response.product.category_id,
                            batch_id: response.product.batch_id,
                            category: category || { id: 0, name: "Sin categoría" },
                            batches: batch || { id: 0, name: "Sin lote", description: "", quantity: 0, status: "unknown", order_creation_date: "" },
                        },
                    ]);
                    setShowNotification(true);
                    setTypeMessage("success");
                    setErrorMessage("El registro fue agregado exitosamente");
                    setShowSpinner(false);
                    cleanInputs();
                } else {
                    console.error("El ID del producto no está definido en la respuesta:", response);
                    setShowNotification(true);
                    setTypeMessage("error");
                    setErrorMessage("El ID del producto no está definido en la respuesta:");
                    setShowSpinner(false);
                }
            }else{
                const response = await updateProduct(
                    session?.user.token as any,
                    Number(formData.id),
                    formData.name,
                    formData.description,
                    Number(formData.price),
                    Number(formData.category),
                    Number(formData.quantity),
                    Number(formData.batch),
                );
                if (response){
                    setProducts(
                        products.map((product) => {
                            if (product.id === Number(formData.id)) {
                                return {
                                    ...product,
                                    name: formData.name,
                                    description: formData.description,
                                    price: Number(formData.price),
                                    category_id: Number(formData.category),
                                    quantity: Number(formData.quantity),
                                    batch_id: Number(formData.batch),
                                    category: categories.find((category) => category.id === Number(formData.category)) || { id: 0, name: "" },
                                    batches: batches.find((batch) => batch.id === Number(formData.batch)) || { id: 0, name: "", description: "", quantity: 0, status: "unknown", order_creation_date: "" },
                                };
                            }
                            return product;
                        }
                    ));
                    
                    setShowNotification(true);
                    setTypeMessage("success");
                    setErrorMessage("El registro fue actualizado satisfactoriamente"); 
                    setShowSpinner(false);
                    cleanInputs();
                }
            }
        } catch (errors) {
            console.error("Error actualizando o guardando registro:", errors);
            setShowNotification(true);
            setTypeMessage("error");
            setErrorMessage("Error actualizando o guardando registro"); 
            setShowSpinner(false);
        }
        finally{
            if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 10000); // 10 segundos
            return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
            }
          }
      };
    const cleanInputs = () =>{
        formData.name = "";
        formData.description = "";
        formData.price = "";
        formData.quantity = "";
        formData.category="";
        formData.batch="";
    }
    
    const handleEditClick = (product: Product) => {
        setFormData({
            name: product.name,
            id: String(product.id),
            description: product.description,
            price: String(product.price),
            category: String(product.category_id),
            quantity: String(product.quantity || ""),
            batch: String(product.batch_id),
        });
        setIsModalOpen(true);
        setTypeRequest("update");
    };
    
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro de eliminar este producto?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#72cb10',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar!'
        });
        if (result.isConfirmed) {
            setShowSpinner(true);
            const session = await getSession(); 
            const response = await deleteProduct(session?.user.token as string, id);
            if(response === 204){
                console.log("producto eliminado correctamente:", id);
                console.log("productos antes de eliminar:", products);
                 // Filtrar también la lista de usuarios mostrada en la tabla
                setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id));
                setShowNotification(true);
                setTypeMessage("success");
                setErrorMessage("El registro fue eliminado exitosamente"); 
                setShowSpinner(false);
            }
            else{
                setShowNotification(true);
                setTypeMessage("error");
                setErrorMessage("Error eliminando el registro"); 
                setShowSpinner(false);
            }
        }
        
    };
    // Determinar el texto del botón basado en el estado 
    const buttonText = typeRequest === 'create' ? 'Guardar' : 'Actualizar';

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowNotification(false);
        }, 10000); // 10 segundos
    
        return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }, [showNotification]); // Dependencia para reiniciar el temporizador

    const handleAddProduct = () => {
        setIsModalOpen(true);
    }

    const totalAmount = products.reduce(
      (total, product) => total + product.price * (product.quantity || 0),
      0
    );
    
    const totalProducts = products.reduce(
      (total, product) => total + (product.quantity || 0),
      0
    );

    const cards = [
      { title: "Total en $", value: totalAmount.toLocaleString("es-ES", {
          style: "currency",
          currency: "USD",
        }) },
      { title: "Total en productos", value: totalProducts },
    ];

    const handleAssingBatch = () => {
        
        setIsModalOpenBatch(true);
    };

    const handleSubmitBatch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setShowSpinner(true);
            setIsModalOpenBatch(false);
            const session = await getSession();
            const response = await updateProduct(
                session?.user.token as any,
                Number(formData.id),
                formData.name,
                formData.description,
                Number(formData.price),
                Number(formData.category),
                Number(formData.quantity),
                Number(formData.batch),
            );
            if (response){
                setProducts(
                    products.map((product) => {
                        if (product.id === Number(formData.id)) {
                            return {
                                ...product,
                                batch_id: Number(formData.batch),
                                batches: batches.find((batch) => batch.id === Number(formData.batch)) || { id: 0, name: "", description: "", quantity: 0, status: "unknown", order_creation_date: "" },
                            };
                        }
                        return product;
                    })
                );
                
                setShowNotification(true);
                setTypeMessage("success");
                setErrorMessage("El lote fue asignado satisfactoriamente"); 
                setShowSpinner(false);
            }
        } catch (errors) {
            console.error("Error actualizando o guardando registro:", errors);
            setShowNotification(true);
            setTypeMessage("error");
            setErrorMessage("Error actualizando o guardando registro"); 
            setShowSpinner(false);
        }
        finally{
            if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 10000); // 10 segundos
            return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
            }
          }
      };


    return(
        <>
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

            <div>
                <div className="flex justify-between items-center mt-4 text-xs text-primary-contrast pb-5">
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

                    <div className="inline-flex rounded-md shadow-sm text-primary-contrast" role="group">
                        <button type="button" onClick={() => {
                            handleAddProduct();
                            }}  className="px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white bg-primary rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                            </svg>
                            Agregar Producto
                        </button>
                        <button type="button" onClick={() => {
                            handleAssingBatch();
                            }}  className="px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white bg-add-options rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                    <path fillRule="evenodd" d="M11.986 3H12a2 2 0 0 1 2 2v6a2 2 0 0 1-1.5 1.937V7A2.5 2.5 0 0 0 10 4.5H4.063A2 2 0 0 1 6 3h.014A2.25 2.25 0 0 1 8.25 1h1.5a2.25 2.25 0 0 1 2.236 2ZM10.5 4v-.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4h3Z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M2 7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7Zm6.585 1.08a.75.75 0 0 1 .336 1.005l-1.75 3.5a.75.75 0 0 1-1.16.234l-1.75-1.5a.75.75 0 0 1 .977-1.139l1.02.875 1.321-2.64a.75.75 0 0 1 1.006-.336Z" clipRule="evenodd" />
                                </svg>
                            Asignar Lote
                        </button>
                        <button type="button" onClick={() => {
                            handleAddProduct();
                            }}  className="px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white bg-remove-list rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                                </svg>
                            Eliminar Productos
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
                {products?.map((product) => ( 
                    <div key={product.id} className="p-4 bg-white rounded-lg shadow border border-gray-300"> 
                        <p>
                            <span className="font-semibold">Nombre:</span> {product.name}
                            <hr />
                            <span className="font-semibold">Descripción:</span> {product.description}
                            <hr />
                            <span className="font-semibold">Precio:</span> {product.price}
                            <hr />
                            <span className="font-semibold">Categoría:</span> {product.category.name}
                            <hr />
                            <span className="font-semibold">Inventario:</span> 
                            {product.quantity ? product.quantity : 'Sin inventario'}
                        </p> 

                        <div className="mt-2 flex justify-end space-x-2"> 
                            <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:underline">Editar</button> 
                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">Eliminar</button> 
                        </div> 
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
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)} title={typeRequest === "create" ? "Agregar Producto" : "Actualizar Producto"}>
                <form onSubmit={handleSubmit} className="text-primary-contrast">
                    <div className="grid gap-6 mb-6 md:grid-cols-1">
                        <div>
                            <label htmlFor="company" className="block mb-2 text-sm font-medium">Nombre de la Categoría</label>
                            <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                            >
                                <option value="">
                                    Selecciona una Categoría
                                </option>
                                {categories?.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        
                    </div>
                    <div className="grid gap-6 mb-6 md:grid-cols-1">
                        <div>
                            <label htmlFor="name" className="block mb-2 text-sm font-medium dark:text-white">Nombre</label>
                            <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="block w-full rounded-md border py-1.5"
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block mb-2 text-sm font-medium dark:text-white">
                                Descripción 
                            </label>
                            <input
                            id="description"
                            name="description"
                            type="text"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border py-1.5"
                            />
                        </div>
                        <div>
                            <label htmlFor="price" className="block mb-2 text-sm font-medium">
                                Precio 
                            </label>
                            <input
                            id="price"
                            name="price"
                            type="text"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            className="block w-full rounded-md border py-1.5"
                            />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block mb-2 text-sm font-medium">
                                Cantidad 
                            </label>
                            <input
                            id="quantity"
                            name="quantity"
                            type="text"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border py-1.5"
                            />
                        </div>
                    </div>
                    <button
                    type="submit"
                    className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
                    disabled={!!btnAction}
                    >
                        {buttonText}
                    </button>
                </form>
            </Modal>
            <Modal
            //* Modal para asignarel lote a un producto
            isOpen={isModalOpenBatch}
            onClose={() => setIsModalOpenBatch(false)} title="Asignar Lote">
                <form onSubmit={handleSubmitBatch} className="text-primary-contrast">
                    <div className="grid gap-6 mb-6 md:grid-cols-1">
                        <div>
                            <label htmlFor="batch" className="block mb-2 text-sm font-medium">Lote</label>
                            <select
                            id="batch"
                            name="batch"
                            value={formData.batch}
                            onChange={handleInputChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
                        <button
                            type="submit"
                            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
                        >
                            Asignar Lote
                        </button>
                    </div>
                </form>

                </Modal>
        </>
    )
    
}


export default ProductPage;