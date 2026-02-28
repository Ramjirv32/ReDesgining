import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
    const baseStyles = 'animate-pulse bg-gray-200';
    const variantStyles = {
        rectangular: 'rounded-md',
        circular: 'rounded-full',
        text: 'rounded h-4 w-full'
    };

    return (
        <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
    );
};

export const EventCardSkeleton = () => (
    <div className="w-[285px] h-[550px] bg-white rounded-[10px] border border-gray-200 overflow-hidden">
        <Skeleton className="w-full h-[380px]" />
        <div className="p-4 space-y-3">
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="h-6 w-3/4" />
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-full mt-4" />
        </div>
    </div>
);

export const ArtistSkeleton = () => (
    <div className="flex flex-col items-center gap-4">
        <Skeleton variant="circular" className="w-[90px] h-[90px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px]" />
        <Skeleton variant="text" className="w-20" />
    </div>
);

export const DetailSkeleton = () => (
    <div className="max-w-[1440px] mx-auto px-4 md:px-14 py-8 space-y-12 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-12">
                <Skeleton className="w-full h-[350px] md:h-[500px] rounded-[30px]" />
                <section className="space-y-4">
                    <Skeleton variant="text" className="h-10 w-1/4" />
                    <Skeleton variant="text" className="h-40 w-full" />
                </section>
                <section className="space-y-6">
                    <Skeleton variant="text" className="h-10 w-1/4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <Skeleton className="h-20 rounded-[15px]" />
                        <Skeleton className="h-20 rounded-[15px]" />
                        <Skeleton className="h-20 rounded-[15px]" />
                    </div>
                </section>
            </div>
            <div className="w-full lg:w-[400px]">
                <Skeleton className="h-[400px] rounded-[20px]" />
            </div>
        </div>
    </div>
);

export const TicketSkeleton = () => (
    <div className="w-full bg-white border border-gray-200 rounded-[15px] p-6 space-y-4">
        <div className="flex justify-between items-start gap-6">
            <div className="flex-grow space-y-3">
                <Skeleton variant="text" className="h-8 w-1/3" />
                <Skeleton variant="text" className="h-10 w-1/4" />
                <Skeleton className="h-[1px] w-full" />
                <Skeleton variant="text" className="w-2/3" />
            </div>
            <Skeleton className="w-20 h-10 rounded-[7px] flex-shrink-0" />
        </div>
    </div>
);
