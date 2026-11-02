"use client";

import { useEffect, useState, useTransition } from "react";
import { getOrCreateDeviceId } from "@/lib/device-id";
import type { Candidate } from "@/lib/candidates";
import type { EventInfo } from "@/lib/event";
import { CandidatePhoto } from "@/components/CandidatePhoto";

type StatusResponse = {
  hasVoted: boolean;
  candidateId?: string | null;
  counts: Record<string, number>;
};

type Phase = "loading" | "ready" | "voting" | "done" | "error";

export function VoteApp({
  candidates,
  event,
}: {
  candidates: Candidate[];
  event: EventInfo;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [deviceId, setDeviceId] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    startTransition(async () => {
      try {
        const res = await fetch("/api/status", {
          headers: { "x-device-id": id },
          cache: "no-store",
        });
        const data = (await res.json()) as StatusResponse;
        setCounts(data.counts ?? {});
        if (data.hasVoted && data.candidateId) {
          setVotedFor(data.candidateId);
          setPhase("done");
          setMessage("Вы уже проголосовали с этого устройства.");
        } else {
          setPhase("ready");
        }
      } catch {
        setPhase("error");
        setMessage("Не удалось загрузить голосование. Обновите страницу.");
      }
    });
  }, []);

  async function submitVote(candidateId: string) {
    if (phase !== "ready" || isPending) return;
    setSelectedId(candidateId);
    setPhase("voting");
    setMessage("");

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, candidateId }),
      });
      const data = await res.json();

      if (data.counts) setCounts(data.counts);

      if (data.ok) {
        setVotedFor(candidateId);
        setPhase("done");
        setMessage("Спасибо! Ваш голос учтён.");
        return;
      }

      if (data.reason === "already_voted") {
        setVotedFor(data.candidateId ?? candidateId);
        setPhase("done");
        setMessage("Вы уже проголосовали с этого устройства.");
        return;
      }

      setPhase("ready");
      setSelectedId(null);
      setMessage("Не удалось отправить голос. Попробуйте ещё раз.");
    } catch {
      setPhase("ready");
      setSelectedId(null);
      setMessage("Ошибка сети. Проверьте соединение и попробуйте снова.");
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const showResults = phase === "done";
  const votedCandidate = candidates.find((c) => c.id === votedFor);

  return (
    <div className="vote-shell">
      <header className="vote-hero">
        <p className="brand" aria-label="Название">
          {event.title}
        </p>
        <p className="org-name">{event.organization}</p>
        <h1 className="headline">
          {phase === "done" ? "Голос принят" : "Выберите кандидата"}
        </h1>
        <p className="lede">
          {phase === "done"
            ? "Результаты обновляются сразу после голосования."
            : "Один голос с устройства. Посмотрите фото и нажмите «Голосовать»."}
        </p>
      </header>

      {phase === "loading" && (
        <div className="state-block" role="status">
          <span className="pulse-dot" />
          Загрузка…
        </div>
      )}

      {phase === "error" && (
        <div className="state-block error" role="alert">
          {message}
        </div>
      )}

      {(phase === "ready" || phase === "voting") && (
        <ul className="candidate-list" aria-label="Кандидаты">
          {candidates.map((c, index) => (
            <li
              key={c.id}
              className="candidate-item"
              style={{ animationDelay: `${0.08 + index * 0.07}s` }}
            >
              <button
                type="button"
                className={`candidate-btn${selectedId === c.id ? " is-selected" : ""}`}
                disabled={phase === "voting"}
                onClick={() => submitVote(c.id)}
              >
                <CandidatePhoto candidate={c} index={index} size="lg" />
                <span className="candidate-name">{c.name}</span>
                <span className="candidate-action">
                  {phase === "voting" && selectedId === c.id
                    ? "Отправка…"
                    : "Голосовать"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showResults && (
        <section className="results" aria-live="polite">
          {message && <p className="confirm-msg">{message}</p>}
          {votedCandidate && (
            <p className="voted-for">
              <CandidatePhoto candidate={votedCandidate} size="sm" />
              <span>
                Ваш выбор: <strong>{votedCandidate.name}</strong>
              </span>
            </p>
          )}
          <h2 className="results-title">Текущие результаты</h2>
          <ul className="results-list">
            {candidates.map((c) => {
              const votes = counts[c.id] ?? 0;
              const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
              const isMine = c.id === votedFor;
              return (
                <li
                  key={c.id}
                  className={`result-row${isMine ? " is-mine" : ""}`}
                >
                  <div className="result-meta">
                    <span className="result-identity">
                      <CandidatePhoto candidate={c} size="sm" />
                      <span className="result-name">{c.name}</span>
                    </span>
                    <span className="result-count">
                      {votes} · {pct}%
                    </span>
                  </div>
                  <div
                    className="result-bar"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <div
                      className="result-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="total-votes">Всего голосов: {total}</p>
        </section>
      )}

      {message && phase === "ready" && (
        <p className="inline-error" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
