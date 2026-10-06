import { cn } from "@/lib/utils";

const FancyHeading = ({ text, className }: { text: string; className?: string }) => {
  return (
    <div className="flex items-center">
      <h1 className={cn("font-bold text-xl md:text-2xl lg:text-3xl 2xl:text-4xl", className)}>
        {text}
      </h1>
    </div>
  );
};

export default FancyHeading;
