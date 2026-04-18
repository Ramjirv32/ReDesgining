import Link from 'next/link';

interface SportCategoryCardProps {
    name: string;
    image: string;
    href?: string;
}

export default function SportCategoryCard({ name, image, href }: SportCategoryCardProps) {
    const content = (
        <div
            className="w-[172px] h-[235px] rounded-[30px] border border-transparent p-4 flex flex-col items-center justify-between cursor-pointer shadow-sm group mx-auto"
            style={{
                background: 'linear-gradient(180deg, #FFFFFF 50%, #E7C200 159.52%) padding-box, linear-gradient(135deg, #686868 0%, #D0D0D0 100%) border-box'
            }}
        >
            <span className="text-xl md:text-2xl font-medium text-black text-center pt-1 break-words leading-tight font-[family-name:var(--font-anek-latin)]">
                {name}
            </span>
            <div className="relative w-full aspect-square flex items-center justify-center">
                <img
                    src={image}
                    alt={name}
                    className="w-[120px] h-[100px] object-contain drop-shadow-md scale-150"
                />
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="block">{content}</Link>;
    }

    return content;
}
