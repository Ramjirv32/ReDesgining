import { ArtistSkeleton, EventCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-16 py-8 md:py-12 space-y-12">
                <section>
                    <Skeleton variant="text" className="h-10 w-48 mb-8" />
                    <div className="flex gap-6 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="w-[173px] h-[232px] bg-zinc-100 rounded-[30px] shrink-0 animate-pulse" />
                        ))}
                    </div>
                </section>

                <section>
                    <Skeleton variant="text" className="h-10 w-32 mb-8" />
                    <div className="flex gap-10 overflow-hidden py-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ArtistSkeleton key={i} />
                        ))}
                    </div>
                </section>

                <section>
                    <Skeleton variant="text" className="h-10 w-40 mb-8" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <EventCardSkeleton key={i} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
