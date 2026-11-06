import Skeleton from "react-loading-skeleton";

const HomePageSkeleton = () => {
  return (
    <div className="w-full min-h-screen">
      <Skeleton width="100%" height="100vh" />
    </div>
  );
};

export default HomePageSkeleton;
