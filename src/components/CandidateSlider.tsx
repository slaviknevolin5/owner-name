"use client";

import { useRef, useState } from "react";
import type { Candidate } from "@/lib/candidates";
import { CandidatePhoto } from "@/components/CandidatePhoto";
import { CandidateMeta } from "@/components/CandidateMeta";

type Props = {
  candidates: Candidate[];
  disabled?: boolean;
  votingId?: string | null;
  onVote: (candidateId: string) => void;
};

export function CandidateSlider({
  candidates,
  disabled = false,
  votingId = null,
  onVote,
}: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const total = candidates.length;
  const current = candidates[index];
  if (!current) return null;

  function goTo(nextIndex: number, dir: "next" | "prev") {
    if (total === 0) return;
    const wrapped = ((nextIndex % total) + total) % total;
    setDirection(dir);
    setIndex(wrapped);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    touchDeltaX.current = (e.touches[0]?.clientX ?? 0) - touchStartX.current;
  }

  function onTouchEnd() {
    const delta = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goTo(index + 1, "next");
    else goTo(index - 1, "prev");
  }

  return (
    <section
      className="candidate-slider"
      aria-roledescription="carousel"
      aria-label="Кандидаты"
    >
      <div
        className="slide-stage"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <article
          key={`${current.id}-${direction}`}
          className={`slide-card slide-card--${direction}`}
        >
          <CandidatePhoto candidate={current} index={index} size="lg" />
          <div className="candidate-copy">
            <p className="candidate-name">{current.name}</p>
            <CandidateMeta candidate={current} />
          </div>
          <button
            type="button"
            className={`candidate-action${votingId === current.id ? " is-busy" : ""}`}
            disabled={disabled}
            onClick={() => onVote(current.id)}
          >
            {votingId === current.id ? "Отправка…" : "Голосовать"}
          </button>
        </article>
      </div>

      <div className="slider-controls">
        <button
          type="button"
          className="slider-nav"
          aria-label="Предыдущий кандидат"
          onClick={() => goTo(index - 1, "prev")}
          disabled={disabled || total < 2}
        >
          ←
        </button>

        <div className="slider-dots" role="tablist" aria-label="Слайды кандидатов">
          {candidates.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Кандидат ${i + 1}: ${c.name}`}
              className={`slider-dot${i === index ? " is-active" : ""}`}
              onClick={() => goTo(i, i > index ? "next" : "prev")}
              disabled={disabled}
            />
          ))}
        </div>

        <button
          type="button"
          className="slider-nav"
          aria-label="Следующий кандидат"
          onClick={() => goTo(index + 1, "next")}
          disabled={disabled || total < 2}
        >
          →
        </button>
      </div>

      <p className="slider-hint">
        Листайте влево/вправо · {index + 1} из {total}
      </p>
    </section>
  );
}
