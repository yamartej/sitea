const PopTable = () => {
    return (
        <>
        <div className="overflow-x-auto hidden md:block">
                            <table className="min-w-full border-collapse border border-gray-300 text-left">
                                <thead>
                                <tr className="bg-gray-200">
                                    <th className="px-4 py-2 border border-gray-300">Nombre</th>
                                    <th className="px-4 py-2 border border-gray-300">Email</th>
                                    <th className="px-4 py-2 border border-gray-300">Roles</th>
                                    <th className="px-4 py-2 border border-gray-300">Acciones</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredUsers?.map((user : User) => (
                                    <tr  key={user.id} className="bg-white hover:bg-gray-100 transition">
                                        <td className="px-4 py-2 border border-gray-300">{user.name}</td>
                                        <td className="px-4 py-2 border border-gray-300">{user.email}</td>
                                        <td className="px-4 py-2 border border-gray-300">
                                            <ul className="list-disc pl-5">
                                                {user.roles.map((role) => (
                                                <li key={role.id}>{role.name}</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-4 py-2 border border-gray-300 text-center">
                                        <button className="text-blue-600 hover:underline"
                                        onClick={() => handleEditClick(user)}
                                        >Editar</button>
                                        <button
                                        className="ml-2 text-red-600 hover:underline"
                                        onClick={() => handleDelete(user.id)}
                                        >
                                            Eliminar
                                        </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
        </>
    );
}
export default PopTable;
