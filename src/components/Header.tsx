import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-zinc-300 px-6 py-5">
      <Link href="/">
        <Image src="/logo.svg" alt="genius.ben-mini.com" width={240} height={48} />
      </Link>
    </header>
  );
}
