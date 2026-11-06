import Image from "next/image";

const TopHero = () => {
  return (
    <div className="relative w-full aspect-[16/6] overflow-hidden bg-muted sm:aspect-[1920/600]">
      <Image
        src="/images/banner/banner_image.webp"
        alt="Customer Dashboard Banner"
        fill
        priority
        loading="eager"
        sizes="100vw"
        className="object-cover object-center"
      />
    </div>
  );
};

export default TopHero;
