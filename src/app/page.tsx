import { VoteApp } from "@/components/VoteApp";
import { getCandidates } from "@/lib/candidates";
import { getEventInfo } from "@/lib/event";
import Link from "next/link";

export default function HomePage() {
  const candidates = getCandidates();
  const event = getEventInfo();

  return (
    <main className="page">
      <VoteApp candidates={candidates} event={event} />
      <footer className="page-footer">
        <Link href="/qr">QR-код для печати</Link>
      </footer>
    </main>
  );
}
