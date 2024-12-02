import Userpage from "@/components/Admin/UserPage";
import AuthLayout from "../protected/layout";
const User = () =>{

    return (
        <AuthLayout>
            <div className="p-4 sm:ml-64">
                <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
                <Userpage></Userpage>
                </div>
                
            </div>
            
            
        </AuthLayout>
        
    )
}

export default User;