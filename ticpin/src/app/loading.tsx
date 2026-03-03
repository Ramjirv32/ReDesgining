export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#5331EA] border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 font-medium animate-pulse">Loading TicPin...</p>
            </div>
        </div>
    );
}
