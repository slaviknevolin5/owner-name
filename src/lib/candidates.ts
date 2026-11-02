import candidatesData from "../../data/candidates.json";

export type Candidate = {
  id: string;
  name: string;
};

export function getCandidates(): Candidate[] {
  return candidatesData as Candidate[];
}

export function getCandidateById(id: string): Candidate | undefined {
  return getCandidates().find((c) => c.id === id);
}
