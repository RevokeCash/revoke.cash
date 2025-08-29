import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export const EmptyState = ({ title, description, action, icon }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        {title}
      </h3>
      
      <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};