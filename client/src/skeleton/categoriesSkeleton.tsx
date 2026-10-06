"use client";

import Skeleton from "react-loading-skeleton";

const CategoriesSkeleton = () => {
    const skeletonCount = 8; // number of skeleton cards

    return (
        <div className="w-full space-y-6">
            <div>
                <Skeleton width="100%" height="70vh" />
            </div>
            <div className="container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: skeletonCount }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        {/* Image Skeleton */}
                        <Skeleton
                            width={"100%"}
                            height={310}
                        />
                        {/* Title Skeleton */}
                        <Skeleton width="60%" height={20} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoriesSkeleton;
