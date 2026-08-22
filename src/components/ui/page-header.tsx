import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backButton?: boolean;
  backTo?: string;
  className?: string;
  titleClassName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  backButton = false,
  backTo,
  className,
  titleClassName,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn("mb-6", className)}>
      {backButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4 -ml-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}

      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-1 min-w-0">
          <h1
            className={cn(
              "text-base font-bold tracking-tight text-gray-900 sm:text-xl lg:text-2xl dark:text-gray-100 sm:pr-36",
              titleClassName || "line-clamp-2",
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="text-base text-gray-800 line-clamp-1 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0 w-full lg:w-auto">{actions}</div>
        )}
      </div>
    </div>
  );
};
