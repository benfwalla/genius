import Link from "next/link";
import Image from "next/image";

export default function Header({
  scrolledContent,
}: {
  scrolledContent?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-zinc-300">
      <div className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="shrink-0">
          <Image src="/logo.svg" alt="genius.ben-mini.com" width={200} height={40} />
        </Link>
        {scrolledContent}
      </div>
    </header>
  );
}
