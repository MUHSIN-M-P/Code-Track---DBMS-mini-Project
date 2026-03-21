import { cn } from "@/utils/cn";
import { ComponentProps } from "react";

export function Card({ children, className }: ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "w-full md:min-w-sm bg-card-background-50 flex flex-col rounded-xl shadow-lg border border-base-200 p-6",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: ComponentProps<"div">) {
    return (
        <div className={cn("w-full relative mb-4", className)}>{children}</div>
    );
}

export function CardTitle({ children, className }: ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "text-xl md:text-2xl font-bold text-title-50 leading-tight",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function CardDescription({
    children,
    className,
}: ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "mt-2 text-base text-text-100 leading-relaxed",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function CardAction({ children, className }: ComponentProps<"div">) {
    return (
        <div className={cn("absolute top-0 right-0 text-text-50", className)}>
            {children}
        </div>
    );
}

export function CardContent({ children, className }: ComponentProps<"div">) {
    return <div className={cn("text-text-100", className)}>{children}</div>;
}

export function CardFooter({ children, className }: ComponentProps<"div">) {
    return (
        <div className={cn("mt-6 pt-4 border-t border-base-200", className)}>
            {children}
        </div>
    );
}
