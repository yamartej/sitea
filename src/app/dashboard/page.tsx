import Dashboard from "@/components/Dashboard/DashboardPage";
import AuthLayout from "../protected/layout";

const DashboardPage = () => {
  
  return(
    <AuthLayout>
        <Dashboard/>
    </AuthLayout>
    
  ) 
  
};

export default DashboardPage;