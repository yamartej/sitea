"use client"
import { useEffect, useState } from "react"; 
import { fetchBatchesWithProducts, fetchCategoriesList, fetchCompaniesList, registerProduct, updateProduct, deleteProduct, updateBatchProduct} from "@/app/api/admin/api";
import { fetchBatchesList } from "@/app/api/purchase/api";
import { getSession } from 'next-auth/react';
import { Batch, Category, Product, BatchesWithProduct, Company } from "@/types/type";
import Notification from "../Common/Notification/NotificationPage";
import Spinner from "../Common/Spinner/SpinnerPage";
import Swal from "sweetalert2";
import React from "react";
import { useTable, usePagination, Column, useSortBy, useExpanded } from 'react-table';
import Modal from "../Common/Modal/ModalPage";
import InfoCardGrid from "../Common/Card/InfoCardGrid";

const ProductPage = () => {
    const [batchesWithProducts, setBatchesWithProducts] = useState<BatchesWithProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [showSpinner, setShowSpinner] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editRowId, setEditRowId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
            id: "",
            name: "",
            description: "",
            price: "",
            category: "",
            quantity: "",
            batch: "",
          });
        const [typeMessage, setTypeMessage] = useState("error");
        const [typeRequest, setTypeRequest] = useState("create");
        const [errors, setErrors] = useState<{
                priceMessage: string | null;
              }>({
                priceMessage: null,
              });
        const [btnAction, setBtnAction] = useState(false);
    const [loteName, setLoteName] = useState("")
    useEffect(() => {
        const fetchProducts = async () => {
            setShowSpinner(true);
            const session = await getSession();
            const token = session?.user.token as string;
            const ownCompanyId = session?.user.company_id || null;

            setCompanyId(ownCompanyId);

            try {
                const dataCategories = await fetchCategoriesList(token);
                setCategories(dataCategories);

                if (ownCompanyId) {
                    const data = await fetchBatchesWithProducts(token, ownCompanyId);
                    const dataBatches = await fetchBatchesList(token, ownCompanyId);
                    setBatchesWithProducts(data);
                    setBatches(dataBatches);
                } else {
                    const companyData = await fetchCompaniesList(token);
                    setCompanies(companyData);
                    setBatchesWithProducts([]);
                    setBatches([]);
                }
            } catch (error) {
                console.error("Error fetching:", error);
                setErrorMessage("Error fetching");
                setShowNotification(true);
            } finally {
                setShowSpinner(false);
            }
        };

        fetchProducts();
    }, []);

    const handleCompanyChange = async (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const nextCompanyId = e.target.value;
        setSelectedCompanyId(nextCompanyId);
        setIsModalOpen(false);
        setEditRowId(null);

        if (!nextCompanyId) {
            setBatchesWithProducts([]);
            setBatches([]);
            return;
        }

        const session = await getSession();
        try {
            setShowSpinner(true);
            const token = session?.user.token as string;
            const data = await fetchBatchesWithProducts(token, nextCompanyId);
            const dataBatches = await fetchBatchesList(token, nextCompanyId);
            setBatchesWithProducts(data);
            setBatches(dataBatches);
        } catch (error) {
            console.error("Error fetching company products:", error);
            setErrorMessage("Error cargando datos de la empresa");
            setTypeMessage("error");
            setShowNotification(true);
        } finally {
            setShowSpinner(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowNotification(false);
        }, 10000); // 10 segundos
        return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }, [showNotification]); // Dependencia para reiniciar el temporizador

    const columns: Column<BatchesWithProduct>[] = React.useMemo(
        () => [
            //Agregar un expansor para mostrar los productos de cada batch
            {
                id: 'expander',
                Header: () => null,
                Cell: ({ row }) => (
                    <span {...row.getToggleRowExpandedProps()}>
                        {row.isExpanded ? '-' : '+'}
                    </span>
                ),
            },            
            {
                Header: 'Nombre',
                accessor: 'name',
            },            
            {
                Header: 'DescripciÃ³n',
                accessor: 'description',
            },
            {
                Header: 'Estatus',
                accessor: 'status',
            },
            {
                Header: 'Fecha de creaciÃ³n',
                accessor: 'order_creation_date',
                Cell: ({ value }) => new Date(value).toLocaleDateString(),
            },
            {
                Header: 'Acciones',
                Cell: ({ row }) => (
                    <div className="flex justify-center space-x-2">
                        <button title="Agregar Producto" onClick={() => handleAddProduct(row.original)} 
                            className="text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                    <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                                </svg>

                        </button>
                        
                        
                    </div>
                ),
            },
            
        ],
        [batchesWithProducts]
    );



    const {
            getTableProps,
            getTableBodyProps,
            headerGroups,
            rows,
            prepareRow,
            page, // Filas de la pÃ¡gina actual
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
                data: batchesWithProducts,
                initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por pÃ¡gina
            },
            useSortBy, // Agregar el plugin de ordenaciÃ³n
            useExpanded,
            usePagination, // Agregar el plugin de paginaciÃ³n
        );
    
    const [cards, setCards] = useState([
        { title: "Total en $", value: 0 },
        { title: "Total en productos", value: 0 },
    ]);

    const buttonText = typeRequest === 'create' ? 'Guardar' : 'Actualizar';

    const handleExpandRow = (row: import('react-table').Row<BatchesWithProduct>) => {
        // Sumar el total de productos y el monto total de los productos del batch expandido
        const totalProducts = row.original.products.reduce((acc, prod) => acc + Number(prod.quantity), 0);
        const totalAmount = row.original.products.reduce((acc, prod) => acc + (Number(prod.quantity) * Number(prod.price)), 0);

        setCards([
            { title: "Total en $", value: totalAmount },
            { title: "Total en productos", value: totalProducts },
        ]);
    };

    const handleAddProduct = ( batchesWithProduct : BatchesWithProduct) => {
        setIsModalOpen(true);
        setLoteName(batchesWithProduct.name);
        setFormData({
            ...formData,
            batch: String(batchesWithProduct.id),
        });
    }
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
            const session = await getSession();
            const tenantCompanyId = companyId || selectedCompanyId;
            if (!tenantCompanyId) {
                setShowNotification(true);
                setTypeMessage("error");
                setErrorMessage("Selecciona una empresa antes de guardar");
                setShowSpinner(false);
                return;
            }
            if(typeRequest === "create"){
                const response = await registerProduct(
                session?.user.token as any,
                formData.name,
                formData.description,
                Number(formData.price),
                Number(formData.category),
                Number(formData.quantity),
                Number(formData.batch),
                tenantCompanyId,
                );
                if (response && response.product.id) {
                    // Buscar el nombre de la categorÃ­a correspondiente
                    const category = categories.find((category) => category.id === Number(formData.category));
                                            
                    // Agregar el nuevo producto al estado
                    
                    setBatchesWithProducts((prevBatches) =>
                    prevBatches.map((batch) => {
                        if (batch.id === Number(formData.batch)) {
                        const newProduct: Product = {
                            ...response.product,
                            id: response.product.id,
                            name: formData.name,
                            description: formData.description,
                            price: Number(formData.price),
                            quantity: Number(formData.quantity),
                            category_id: Number(formData.category),
                            batch_id: Number(formData.batch),
                            warehouseName: response.product.warehouseName ?? '',
                            price_shipping: response.product.price_shipping ?? 0,
                        };

                        return {
                            ...batch,
                            products: [...batch.products, newProduct],
                        };
                        }
                        return batch;
                    })
                    );
                    
                    setFormData({
                        ...formData,
                        name: "",
                        description: "",
                        price: "",
                        category: "",
                        quantity: "",
                    });
                    setShowNotification(true);
                    setTypeMessage("success");
                    setErrorMessage("El registro fue agregado exitosamente");
                    setShowSpinner(false);
                } else {
                    console.error("El ID del producto no estÃ¡ definido en la respuesta:", response);
                    setShowNotification(true);
                    setTypeMessage("error");
                    setErrorMessage("El ID del producto no estÃ¡ definido en la respuesta:");
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
                tenantCompanyId,
                );
                if (response){
                    // Actualizar el producto en el estado
                    setBatchesWithProducts((prevBatches) =>
                        prevBatches.map((batch) => {
                            if (batch.id === Number(formData.batch)) {
                                const updatedProducts = batch.products.map((prod) => {
                                    if (prod.id === Number(formData.id)) {
                                        return {
                                            ...prod,
                                            name: formData.name,
                                            description: formData.description,
                                            price: Number(formData.price),
                                            quantity: Number(formData.quantity),
                                            category_id: Number(formData.category),
                                        };
                                    }
                                    return prod;
                                });
                                return {
                                    ...batch,
                                    products: updatedProducts,
                                };
                            }
                            return batch;
                        })
                    );
                    setFormData({
                        ...formData,
                        name: "",
                        description: "",
                        price: "",
                        category: "",
                        quantity: "",
                    });
                    setEditRowId(null);
                    setLoteName("");
                    setTypeRequest("create");
                    setBtnAction(false);
                    setIsModalOpen(false);
                    setShowNotification(true);
                    setTypeMessage("success");
                    setErrorMessage("El registro fue actualizado satisfactoriamente"); 
                    setShowSpinner(false);
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


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
        const { name, value } = e.target; 
        setFormData({ 
            ...formData, 
            [name]: value 
        });

        // ValidaciÃ³n en tiempo real de las contraseÃ±as
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

    const handleRemoveProduct =  async(product:Product) =>{
        const result = await Swal.fire({
                    title: 'Â¿EstÃ¡s seguro de eliminar este producto?',
                    text: "No podrÃ¡s revertir esto",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#72cb10',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'SÃ­, eliminar!'
                });
                if (result.isConfirmed) {
                    setShowSpinner(true);
                    const session = await getSession(); 
                    const tenantCompanyId = companyId || selectedCompanyId;
                    if (!tenantCompanyId) {
                        setShowNotification(true);
                        setTypeMessage("error");
                        setErrorMessage("Selecciona una empresa antes de eliminar");
                        setShowSpinner(false);
                        return;
                    }
                    const response = await deleteProduct(
                        session?.user.token as string,
                        product.id,
                        tenantCompanyId
                    );
                    if(response === 204){
                         // Filtrar tambiÃ©n la lista de usuarios mostrada en la tabla
                        setBatchesWithProducts((prevBatches) =>
                            prevBatches.map((batch) => {
                                if (batch.id === Number(product.batch_id)) {
                                    const filteredProducts = batch.products.filter((prod) => prod.id !== product.id);
                                    return {
                                        ...batch,
                                        products: filteredProducts,
                                    };
                                }
                                return batch;
                            })
                        );
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
        }
    const handleEditClick = (product: Product) => {
        setIsModalOpen(true);
        setTypeRequest("update");
        setEditRowId(String(product.id));
        setFormData({
            id: String(product.id),
            name: product.name,
            description: product.description,
            price: String(product.price),
            category: String(product.category_id),
            quantity: String(product.quantity),
            batch: String(product.batch_id),
        });
        const batch = batches.find((batch) => batch.id === Number(product.batch_id));
        if (batch) {
            setLoteName(batch.name);
        }
        else {
            setLoteName("");
        }
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
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">GestiÃ³n de Compras</h1>
                
            </div>
            {!companyId && (
                <div className="mb-4 text-primary-contrast">
                    <label
                        htmlFor="product_company_id"
                        className="block mb-2 text-sm font-medium"
                    >
                        Empresa
                    </label>
                    <select
                        id="product_company_id"
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
                <InfoCardGrid cards={cards}/>
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
                                                            ? " â†“"
                                                            : " â†‘"
                                                        : " â†“â†‘"
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
                        const { key: rowKey, ...restRowProps } = row.getRowProps();
                        return (
                            <React.Fragment key={row.id}>
                                <tr
                                    key={rowKey}
                                    {...restRowProps}
                                    className={`transition ${
                                        String(row.original.id) === editRowId
                                            ? 'bg-yellow-300 border-l-4 border-yellow-500'
                                            : 'odd:bg-white bg-gray-100 hover:bg-gray-100'
                                    }`}
                                    onClick={() => {
                                        // Solo sumar si la fila no estÃ¡ expandida (para evitar doble suma al cerrar)
                                        if (!row.isExpanded) handleExpandRow(row);
                                    }}
                                >
                                    {row.cells.map((cell) => {
                                        const { key: cellKey, ...restCellProps } = cell.getCellProps();
                                        return (
                                            <td key={cellKey} {...restCellProps} className="px-4 py-2">
                                                {cell.render('Cell')}
                                            </td>
                                        );
                                    })}
                                </tr>
                                {row.isExpanded && (
                                    <tr className="bg-yellow-300">
                                        <td colSpan={row.cells.length} className="px-4 py-2 text-sm text-gray-600">
                                            {/* AquÃ­ va el detalle de la compra, por ejemplo una lista de productos */}
                                            <table className="w-full text-sm text-left text-gray-600 border border-gray-200">
                                                <thead className="bg-gray-100 text-gray-700">
                                                    <tr>
                                                        <th className="px-4 py-2 border">Nombre</th>
                                                        <th className="px-4 py-2 border">price</th>
                                                        <th className="px-4 py-2 border">Cantidad</th>
                                                        <th className="px-4 py-2 border">AcciÃ³n</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {row.original.products.map((item, i) => (
                                                        <tr key={i} className="bg-white">
                                                            <td className="px-4 py-2 border">{item.name}</td>
                                                            <td className="px-4 py-2 border">{item.price}</td>
                                                            <td className="px-4 py-2 border">{item.quantity}</td>
                                                            <td className="px-4 py-2 border">
                                                                <button title="Editar Producto" onClick={() => handleRemoveProduct(item)}
                                                                    className="text-primary mr-2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                                                        <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                                <button title="Editar Producto" onClick={() => handleEditClick(item)} 
                                                                    className="text-primary mr-2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                                                            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                                                            <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                                                        </svg>
                                                                </button>                                                               


                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${typeRequest === "create" ? "Agregar Producto" : "Actualizar Producto"} - Lote: ${loteName}`}>
            <form onSubmit={handleSubmit} className="text-primary-contrast">
                <div className="grid gap-6 mb-6 md:grid-cols-1">
                    <div>
                        <label htmlFor="company" className="block mb-2 text-sm font-medium">Nombre de la CategorÃ­a</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                            >
                                <option value="">
                                    Selecciona una CategorÃ­a
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
                                DescripciÃ³n 
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
    </div>
    );
    }
export default ProductPage;
