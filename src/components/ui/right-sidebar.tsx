import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface RightSidebarProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}

/**
 * RightSidebar — reusable sidebar card for manuscript detail pages.
 *
 * Used by AuthorSidebar, EditorInChiefSidebar, ManagingEditorSidebar,
 * ProductionEditorSidebar, and PublishingEditorSidebar for consistent UI.
 */
export function RightSidebar({
    title,
    icon,
    children,
    className,
}: RightSidebarProps) {
    return (
        <div
            className={cn(
                "rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm",
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                {icon && (
                    <span className="text-gray-400 dark:text-gray-500">
                        {icon}
                    </span>
                )}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {title}
                </h3>
            </div>

            {/* Body — sections separated by horizontal dividers */}
            <div className="px-4 py-3 [&>*+*]:border-t [&>*+*]:border-gray-100 dark:[&>*+*]:border-gray-800 [&>*+*]:pt-3 [&>*+*]:mt-3">
                {children}
            </div>
        </div>
    );
}

export interface RightSidebarSectionProps {
    label: string;
    children: ReactNode;
}

/**
 * RightSidebarSection — labeled subsection inside a RightSidebar.
 */
export function RightSidebarSection({
    label,
    children,
}: RightSidebarSectionProps) {
    return (
        <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {label}
            </p>
            {children}
        </div>
    );
}
