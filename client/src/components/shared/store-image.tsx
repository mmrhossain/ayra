import { cloudinaryLoader, isCloudinaryUrl } from "@/helpers/cloudinary";
import Image, { type ImageProps } from "next/image";

export default function StoreImage(props: ImageProps) {
  const { src, alt, ...rest } = props;
  const loader = typeof src === "string" && isCloudinaryUrl(src) ? cloudinaryLoader : undefined;

  return <Image src={src} alt={alt} loader={loader} {...rest} />;
}
