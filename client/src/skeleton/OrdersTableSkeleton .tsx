const OrdersTableSkeleton = ({ rows = 5 }: { rows?: number }) => {

    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="border-b last:border-b-0">
                    {/* Order # */}
                    <td className="px-4 py-3">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse ml-auto" />
                    </td>
                </tr>
            ))}
        </>
    );
};

export default OrdersTableSkeleton;
