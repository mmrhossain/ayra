import { cn } from "@/lib/utils";

const FancyHeading = ({
  text,
  className,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
}) => {
  return (
    <div className="flex min-w-0 items-center">
      <Tag className={cn("text-xl leading-tight font-semibold tracking-tight lg:text-2xl", className)}>
        {text}
      </Tag>
    </div>
  );
};

export default FancyHeading;
