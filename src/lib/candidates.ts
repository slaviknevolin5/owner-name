import candidatesData from "../../data/candidates.json";

export type Candidate = {
  id: string;
  name: string;
  /** Path under /public or absolute URL */
  photo?: string;
};

export function getCandidates(): Candidate[] {
  return candidatesData as Candidate[];
}

export function getCandidateById(id: string): Candidate | undefined {
  return getCandidates().find((c) => c.id === id);
}
