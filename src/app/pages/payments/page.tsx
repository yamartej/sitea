import React from 'react';
import PaymentPage from '@/components/PurchaseManagement/PaymentPage';
const Payments = () => {
    return (
        <>
            <div className="p-4 sm:ml-64">
                <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
                    <h1>This is Payment pages</h1>
                    <PaymentPage/>
                </div>
            </div>            
        </>
    );
}

export default Payments;