import Image from "next/image";

const TopHero = () => {
  return (
    <div className="relative w-full aspect-[1920/600] overflow-hidden bg-slate-100">
      <Image
        src="/images/banner/banner_image.webp"
        alt="Customer Dashboard Banner"
        fill
        priority
        loading="eager"
        // sizes="100vw"
        className="object-cover object-center w-auto h-auto"
      />
    </div>
  );
};

export default TopHero;
