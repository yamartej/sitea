import Userpage from "@/components/Admin/UserPage";
import { getSession } from "next-auth/react";
const User = () =>{
    return (
        <div className="p-4 sm:ml-64">
            <div className="p-4 mt-14">
                <Userpage/>
            </div>
        </div>
    )
}
export default User;