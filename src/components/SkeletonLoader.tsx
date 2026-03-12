import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps { className?: string; }

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn('animate-pulse rounded-xl bg-slate-200 dark:bg-white/5', className)} />
    );
}

export function SkeletonCard() {
    return (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-8 w-1/3 rounded-lg" />
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100 dark:border-white/5">
            <Skeleton className="size-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24 rounded-lg ml-auto" />
        </div>
    );
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
    return (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5">
            <div className="bg-slate-50 dark:bg-white/5 px-8 py-5 flex gap-8">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16 ml-auto" />
            </div>
            {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
    );
}
