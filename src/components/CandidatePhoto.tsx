import type { Candidate } from "@/lib/candidates";

type Props = {
  candidate: Candidate;
  index?: number;
  size?: "md" | "sm";
  className?: string;
};

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

  return (
    <span className={`candidate-photo candidate-photo--${size} ${className}`.trim()}>
      {candidate.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidate.photo}
          alt=""
          width={size === "md" ? 56 : 36}
          height={size === "md" ? 56 : 36}
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
