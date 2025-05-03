import React from "react";
import PricePage from "@/components/Inventory/PricePage";
const Price = () =>{
    return (
        <div>
            <div className="p-4 sm:ml-64">
                <div className="p-4 mt-14">
                    <h1>Gestion de precios</h1>
                    <PricePage/>
                </div>
            </div>
        </div>
    )
}

export default Price;