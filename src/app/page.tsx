import { VoteApp } from "@/components/VoteApp";
import { getCandidates } from "@/lib/candidates";
import Link from "next/link";

export default function HomePage() {
  const candidates = getCandidates();

  return (
    <main className="page">
      <VoteApp candidates={candidates} />
      <footer className="page-footer">
        <Link href="/qr">QR-код для печати</Link>
      </footer>
    </main>
  );
}
