"use client"
import React, { useEffect, useState } from "react";
import { getSession } from 'next-auth/react';
import { Batch, Product } from "@/types/type";
import Notification from "../Common/Notification/NotificationPage";
import Spinner from "../Common/Spinner/SpinnerPage";
import Swal from "sweetalert2";
import { useTable, usePagination, Column, useSortBy } from 'react-table';
import Modal from "../Common/Modal/ModalPage";
import { fetchProductsAvailable } from "@/app/api/inventory/api";


const PricePage = () =>{
    const [batches, setBatches] = useState<Batch[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [showSpinner, setShowSpinner] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [typeMessage, setTypeMessage] = useState("error");
    const [editRowId, setEditRowId] = useState<number | null>(null);
    const [editedCost, setEditedCost] = useState<string>('');
    
    useEffect (() =>{
        const PriceManegement = async () =>{

            const session = await getSession();
            try{
                const dataProducts = await fetchProductsAvailable(
                    session?.user.token as string
                );
                setProducts(dataProducts);
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
        PriceManegement(); 
    }, []);

    const columns: Column<Product>[] = React.useMemo(
        () => [
          {
            Header: 'Nombre',
            accessor: 'name',
          },
          {
            Header: 'Precio Compra',
            accessor: 'price',
          },
          {
            Header: 'Precio + Envío',
            accessor: 'price_shipping',
          },
          {
            Header: 'Precio Final',
            accessor: 'final_cost',
            Cell: ({ row }: { row: { original: Product } }) => {
                const isEditing = editRowId === row.original.id;
              
                return (
                  <div>
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={row.original.final_cost?.toString()}
                          className="w-full border rounded p-1 text-center"
                        />
                        <button
                            className="text-primary"
                            onClick={() => handleSaveClick(row.original)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                            </svg>

                        </button>
                        <button
                            className="text-cancel"
                            onClick={() => handleCancelClick()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                            </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <div>{row.original.final_cost ? row.original.final_cost.toString() : " "}</div>
                        <button
                                className="text-edit"
                                onClick={() => setEditRowId(row.original.id)}
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
                                </svg>



                            </button>
                        
                      </div>
                    )}
                  </div>
                );
              }
              
          },
          
        ],
        [products,editRowId]
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
    const handleSaveClick = (row: Product) => {
        const updatedProducts = products.map((product) =>
            product.id === row.id ? { ...product, final_cost: parseFloat(editedCost) } : product
        );
        setProducts(updatedProducts);
        setEditRowId(null);
    };
    
    const handleCancelClick = () => {
        setEditRowId(null);
        setEditedCost('');
    };
          
    
    return (
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
        </>
    )
}

export default PricePage;