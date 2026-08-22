import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    status?: string | null | undefined;
}

type ValidStatus =
    | "draft"
    | "submitted"
    | "pending_editorial_review"
    | "returned_to_author"
    | "under_review"
    | "revision_requested"
    | "revised"
    | "revision_submitted"
    | "accepted"
    | "rejected"
    | "published"
    | "withdrawn"
    | "active"
    | "inactive"
    | "pending"
    | "approved"
    | "pending_decision"
    | "in_copyedit"
    | "in_production"
    | "pending_initial_review"
    | "editor_screening"
    | "approved_for_review"
    | "reviewers_assigned"
    | "review_in_progress"
    | "reviews_completed"
    | "editor_decision_pending"
    | "accepted_for_publication"
    | "minor_revision_required"
    | "major_revision_required"
    | "revision_under_review"
    | "approved_for_copyedit"
    | "approved_for_production"
    | "approved_for_publishing"
    | "under_peer_review"
    | "editor_evaluating"
    | "revision_required";

type VariantType =
    "default" | "success" | "warning" | "danger" | "info" | "secondary";

const statusConfig: Record<
    ValidStatus,
    { label: string; variant: VariantType }
> = {
    draft: { label: "Draft", variant: "secondary" },
    submitted: { label: "Quality Check", variant: "info" },
    pending_editorial_review: { label: "Quality Check", variant: "info" },
    returned_to_author: { label: "Returned to Author", variant: "warning" },
    under_review: { label: "Peer-Review", variant: "warning" },
    pending_initial_review: {
        label: "Quality Pre-Check",
        variant: "info",
    },
    editor_screening: { label: "Quality Pre-Check", variant: "info" },
    approved_for_review: { label: "Quality Pre-Check", variant: "info" },
    reviewers_assigned: { label: "Peer-Review", variant: "info" },
    review_in_progress: { label: "Peer-Review", variant: "warning" },
    reviews_completed: { label: "Reviews Completed", variant: "info" },
    editor_decision_pending: {
        label: "Editor Decision Pending",
        variant: "info",
    },
    pending_decision: { label: "Pending Decision", variant: "info" },
    revision_requested: { label: "Submit Revision", variant: "warning" },
    minor_revision_required: {
        label: "Minor Revision Required",
        variant: "warning",
    },
    major_revision_required: {
        label: "Major Revision Required",
        variant: "warning",
    },
    revision_required: { label: "Revision Required", variant: "warning" },
    revised: { label: "Revised", variant: "info" },
    revision_submitted: { label: "Pending Decision", variant: "info" },
    revision_under_review: { label: "Peer-Review", variant: "warning" },
    accepted: { label: "Accepted", variant: "success" },
    accepted_for_publication: {
        label: "Accepted for Publication",
        variant: "success",
    },
    rejected: { label: "Rejected", variant: "danger" },
    published: { label: "Published", variant: "success" },
    approved_for_publishing: {
        label: "Approved for Publishing",
        variant: "success",
    },
    withdrawn: { label: "Withdrawn", variant: "secondary" },
    in_copyedit: { label: "Ready to Publish", variant: "success" },
    approved_for_copyedit: {
        label: "Approved for Copy Edit",
        variant: "success",
    },
    in_production: { label: "In Production", variant: "success" },
    approved_for_production: {
        label: "Approved for Production",
        variant: "success",
    },
    under_peer_review: { label: "Peer-Review", variant: "warning" },
    editor_evaluating: { label: "Editor Decision Pending", variant: "info" },
    active: { label: "Active", variant: "success" },
    inactive: { label: "Inactive", variant: "secondary" },
    pending: { label: "Pending", variant: "warning" },
    approved: { label: "Approved", variant: "success" },
};

const statusVariants: Record<VariantType, string> = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    success:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    secondary: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function getStatusBadgeConfig(status?: string | null) {
    if (!status) {
        return {
            label: "Unknown",
            variant: "secondary" as VariantType,
            normalizedStatus: null,
        };
    }

    const normalizedStatus = String(status).trim() as ValidStatus;
    const config = statusConfig[normalizedStatus];

    if (!config) {
        return {
            label: normalizedStatus,
            variant: "secondary" as VariantType,
            normalizedStatus,
        };
    }

    return {
        ...config,
        normalizedStatus,
    };
}

function getStatusBadgeVariantClasses(variant: VariantType): string {
    return statusVariants[variant] || statusVariants.secondary;
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
    const config = getStatusBadgeConfig(status);
    const variantClass = getStatusBadgeVariantClasses(config.variant);

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                variantClass,
                className,
            )}
            {...props}
        >
            <span className="relative flex w-2 h-2">
                <span
                    className={cn(
                        "absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping",
                        getAnimationColor(config.variant),
                    )}
                />
                <span
                    className={cn(
                        "relative inline-flex w-2 h-2 rounded-full",
                        getDotColor(config.variant),
                    )}
                />
            </span>
            {config.label}
        </div>
    );
}

function getAnimationColor(variant: VariantType): string {
    const colors: Record<VariantType, string> = {
        success: "bg-green-400",
        warning: "bg-yellow-400",
        danger: "bg-red-400",
        info: "bg-blue-400",
        secondary: "bg-gray-400",
        default: "bg-gray-400",
    };
    return colors[variant] || colors.default;
}

function getDotColor(variant: VariantType): string {
    const colors: Record<VariantType, string> = {
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500",
        info: "bg-blue-500",
        secondary: "bg-gray-500",
        default: "bg-gray-500",
    };
    return colors[variant] || colors.default;
}

export { StatusBadge, getStatusBadgeConfig, getStatusBadgeVariantClasses };
