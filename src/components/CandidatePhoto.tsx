import type { Candidate } from "@/lib/candidates";

type Props = {
  candidate: Candidate;
  index?: number;
  size?: "lg" | "md" | "sm";
  className?: string;
};

const SIZE_PX = {
  lg: 640,
  md: 56,
  sm: 40,
} as const;

export function CandidatePhoto({
  candidate,
  index,
  size = "md",
  className = "",
}: Props) {
  const initials = candidate.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const px = SIZE_PX[size];

  return (
    <span className={`candidate-photo candidate-photo--${size} ${className}`.trim()}>
      {candidate.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidate.photo}
          alt={candidate.name}
          width={px}
          height={px}
          className="candidate-photo__img"
        />
      ) : (
        <span className="candidate-photo__fallback" aria-hidden="true">
          {initials || "?"}
        </span>
      )}
      {typeof index === "number" && (
        <span className="candidate-photo__badge">{index + 1}</span>
      )}
    </span>
  );
}
