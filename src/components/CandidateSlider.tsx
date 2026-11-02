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
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);

  const startX = useRef<number | null>(null);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);
  const widthRef = useRef(320);
  const pointerId = useRef<number | null>(null);
  const indexRef = useRef(0);
  const dragRef = useRef(0);
  const draggingRef = useRef(false);

  const total = candidates.length;
  if (!total) return null;

  function clampIndex(next: number) {
    return Math.max(0, Math.min(total - 1, next));
  }

  function settleTo(nextIndex: number) {
    const clamped = clampIndex(nextIndex);
    indexRef.current = clamped;
    setIndex(clamped);
    setDragX(0);
    dragRef.current = 0;
    setDragging(false);
    setSettling(true);
    window.setTimeout(() => setSettling(false), 520);
  }

  function beginDrag(clientX: number, width: number, id: number) {
    if (disabled || total < 2) return;
    startX.current = clientX;
    lastX.current = clientX;
    lastT.current = performance.now();
    velocity.current = 0;
    widthRef.current = width || 320;
    pointerId.current = id;
    draggingRef.current = true;
    setDragging(true);
    setSettling(false);
  }

  function moveDrag(clientX: number) {
    if (startX.current == null || !draggingRef.current) return;

    const now = performance.now();
    const dt = Math.max(now - lastT.current, 1);
    const instant = ((clientX - lastX.current) / dt) * 1000;
    // Smooth velocity for swipe feel
    velocity.current = velocity.current * 0.65 + instant * 0.35;
    lastX.current = clientX;
    lastT.current = now;

    let delta = clientX - startX.current;
    const atStart = indexRef.current === 0 && delta > 0;
    const atEnd = indexRef.current === total - 1 && delta < 0;
    if (atStart || atEnd) {
      // Rubber-band edges
      delta *= 0.28;
    }
    dragRef.current = delta;
    setDragX(delta);
  }

  function endDrag() {
    if (startX.current == null) return;

    const width = Math.max(widthRef.current, 1);
    const delta = dragRef.current;
    const v = velocity.current;
    const distanceThreshold = width * 0.16;
    const velocityThreshold = 480;

    startX.current = null;
    pointerId.current = null;
    draggingRef.current = false;

    const flickedLeft = v < -velocityThreshold || delta <= -distanceThreshold;
    const flickedRight = v > velocityThreshold || delta >= distanceThreshold;

    if (flickedLeft) settleTo(indexRef.current + 1);
    else if (flickedRight) settleTo(indexRef.current - 1);
    else settleTo(indexRef.current);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Ignore taps on interactive controls inside the slide
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input")) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    beginDrag(e.clientX, e.currentTarget.clientWidth, e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerId.current !== e.pointerId) return;
    moveDrag(e.clientX);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerId.current !== null && pointerId.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    endDrag();
  }

  const offsetPct = (dragX / Math.max(widthRef.current, 1)) * 100;
  const transform = `translate3d(calc(${-index * 100}% + ${offsetPct}%), 0, 0)`;
  const trackClass = [
    "slide-track",
    dragging ? "is-dragging" : "",
    settling && !dragging ? "is-settling" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className="candidate-slider"
      aria-roledescription="carousel"
      aria-label="Кандидаты"
    >
      <div
        className="slide-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={trackClass} style={{ transform }}>
          {candidates.map((c, i) => (
            <article
              key={c.id}
              className={`slide-card${i === index ? " is-active" : ""}`}
              aria-hidden={i !== index}
            >
              <CandidatePhoto candidate={c} index={i} size="lg" />
              <div className="candidate-copy">
                <p className="candidate-name">{c.name}</p>
                <CandidateMeta candidate={c} />
              </div>
              <button
                type="button"
                className={`candidate-action${votingId === c.id ? " is-busy" : ""}`}
                disabled={disabled || i !== index}
                tabIndex={i === index ? 0 : -1}
                onClick={() => onVote(c.id)}
              >
                {votingId === c.id ? "Отправка…" : "Голосовать"}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="slider-controls">
        <button
          type="button"
          className="slider-nav"
          aria-label="Предыдущий кандидат"
          onClick={() => settleTo(index - 1)}
          disabled={disabled || index === 0}
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
              onClick={() => settleTo(i)}
              disabled={disabled}
            />
          ))}
        </div>

        <button
          type="button"
          className="slider-nav"
          aria-label="Следующий кандидат"
          onClick={() => settleTo(index + 1)}
          disabled={disabled || index >= total - 1}
        >
          →
        </button>
      </div>

      <p className="slider-hint">
        Свайпните влево/вправо · {index + 1} из {total}
      </p>
    </section>
  );
}
