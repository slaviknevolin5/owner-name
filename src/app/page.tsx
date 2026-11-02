import { VoteApp } from "@/components/VoteApp";
import { SoccerBall } from "@/components/SoccerBall";
import { getCandidates } from "@/lib/candidates";
import { getEventInfo } from "@/lib/event";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const candidates = getCandidates();
  const event = getEventInfo();

  return (
    <main className="page">
      <VoteApp candidates={candidates} event={event} />
      <footer className="page-footer">
        <p className="footer-tagline">
          <SoccerBall />
          <span>Честная игра</span>
          <SoccerBall />
          <span>Яркие победы</span>
          <SoccerBall />
          <span>Один голос — одно устройство</span>
        </p>
        <Link href="/qr">QR-код для печати</Link>
      </footer>
    </main>
  );
}
