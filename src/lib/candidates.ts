import candidatesData from "../../data/candidates.json";

export type Candidate = {
  id: string;
  name: string;
  /** Path under /public or absolute URL */
  photo?: string;
  /** e.g. "8 А класс" */
  grade?: string;
  /** e.g. "Вольная борьба" */
  sport?: string;
};

export function getCandidates(): Candidate[] {
  return candidatesData as Candidate[];
}

export function getCandidateById(id: string): Candidate | undefined {
  return getCandidates().find((c) => c.id === id);
}

export function candidateMeta(candidate: Candidate): string {
  return [candidate.grade, candidate.sport]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
}
