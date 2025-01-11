import SalePage from "@/components/Sales/Sales/SalePage";
const Sale = () => {
    return (
        <div>
            <h1>Sale</h1>
            <div className="p-4 sm:ml-64">
                <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
                    <SalePage/>
                </div>
            </div>
        </div>
    );
};
export default Sale;