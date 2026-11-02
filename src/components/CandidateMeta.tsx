import type { Candidate } from "@/lib/candidates";
import { candidateMeta } from "@/lib/candidates";

export function CandidateMeta({ candidate }: { candidate: Candidate }) {
  const meta = candidateMeta(candidate);
  if (!meta) return null;
  return <span className="candidate-meta">{meta}</span>;
}
