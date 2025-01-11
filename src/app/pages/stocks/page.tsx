import StockPage from "@/components/Inventory/StockPage";
const Stock = () => {
    return(
        <>
            <div className="p-4 sm:ml-64">
                <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
                    <StockPage/>
                </div>
            </div>
        </>
    )
}

export default Stock;