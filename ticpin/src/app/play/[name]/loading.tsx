export default function Loading() {
    return (
        <div className="min-h-screen animate-pulse bg-gradient-to-b from-[#FFFCED] via-white to-white">
            <div className="max-w-[1440px] mx-auto px-4 md:px-14 py-8">
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-8">
                        <div className="w-full h-[350px] md:h-[500px] rounded-[30px] bg-zinc-200" />
                        <div className="space-y-3">
                            <div className="h-6 w-48 bg-zinc-200 rounded-full" />
                            <div className="h-4 w-full bg-zinc-100 rounded-full" />
                            <div className="h-4 w-3/4 bg-zinc-100 rounded-full" />
                            <div className="h-4 w-2/3 bg-zinc-100 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-6 w-40 bg-zinc-200 rounded-full" />
                            <div className="flex gap-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-10 w-28 bg-zinc-100 rounded-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[400px] shrink-0">
                        <div className="h-[320px] rounded-[20px] bg-zinc-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}
