import CustomerPage from "@/components/Sales/CustomerPage";
import AuthLayout from "../protected/layout"

const Customer = () =>{
    return(
        <AuthLayout>
            <div className="p-4 sm:ml-64">
                <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
                    <CustomerPage/>
                </div>
            </div>
            
        </AuthLayout>
    )
}

export default Customer;