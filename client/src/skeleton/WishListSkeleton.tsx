import React from 'react';
import Skeleton from "react-loading-skeleton";

const WishListSkeleton = () => {
    return (
        <div className="container mx-auto max-w-6xl space-y-12 py-12">
            <div>
                <Skeleton width={"100%"} height={"30vh"} />
            </div>
        </div>
    );
};

export default WishListSkeleton;