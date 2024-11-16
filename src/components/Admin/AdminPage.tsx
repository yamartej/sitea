const AdminPage = () =>{

    return(
        <>
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full border-collapse border border-gray-300 text-left">
                <thead>
                <tr className="bg-gray-200">
                    <th className="px-4 py-2 border border-gray-300">Nombre</th>
                    <th className="px-4 py-2 border border-gray-300">Descripción</th>
                    <th className="px-4 py-2 border border-gray-300">Categoría</th>
                    <th className="px-4 py-2 border border-gray-300">Precio</th>
                    <th className="px-4 py-2 border border-gray-300">Acciones</th>
                </tr>
                </thead>
                <tbody>
                <tr className="bg-white hover:bg-gray-100 transition">
                    <td className="px-4 py-2 border border-gray-300">Producto A</td>
                    <td className="px-4 py-2 border border-gray-300">Una descripción breve...</td>
                    <td className="px-4 py-2 border border-gray-300">Categoría X</td>
                    <td className="px-4 py-2 border border-gray-300">$10.00</td>
                    <td className="px-4 py-2 border border-gray-300 text-center">
                    <button className="text-blue-600 hover:underline">Editar</button>
                    <button className="ml-2 text-red-600 hover:underline">Eliminar</button>
                    </td>
                </tr>
                {/* Más filas aquí */}
                </tbody>
            </table>
        </div>

        
        
        <div className="block md:hidden mt-2 space-y-4">
            {/* Iterar sobre cada fila como tarjeta individual en dispositivos pequeños */}
            <div className="p-4 bg-white rounded-lg shadow border border-gray-300">
                <p><span className="font-semibold">Nombre:</span> Producto A</p>
                <p><span className="font-semibold">Descripción:</span> Una descripción breve...</p>
                <p><span className="font-semibold">Categoría:</span> Categoría X</p>
                <p><span className="font-semibold">Precio:</span> $10.00</p>
                <div className="mt-2 flex justify-end space-x-2">
                <button className="text-blue-600 hover:underline">Editar</button>
                <button className="text-red-600 hover:underline">Eliminar</button>
                </div>
            </div>
        </div>

        </>
    

    
    )
}
export default AdminPage;