"use client";

import React, { useEffect, useState } from "react";

export const GUIDE_STORAGE_KEY = "vocab_guide_seen_v1";

/** Returns true when the user has never dismissed the guide before. */
export const shouldShowGuide = (): boolean => {
  try {
    return !window.localStorage.getItem(GUIDE_STORAGE_KEY);
  } catch {
    // private mode / storage disabled -> just don't nag the user
    return false;
  }
};

export const markGuideAsSeen = () => {
  try {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, "1");
  } catch {
    // ignore
  }
};

interface GuideStep {
  icon: string;
  title: string;
  lines: string[];
}

const STEPS: GuideStep[] = [
  {
    icon: "👋",
    title: "Welcome to Japflix Voca",
    lines: [
      "Build your own wordbook, generate example sentences for each word, and test yourself whenever you like.",
      "A directory named (Default) has already been created for you, so you can start adding words right away.",
      "This guide only takes a few seconds — you can reopen it any time from the menu.",
    ],
  },
  {
    icon: "📁",
    title: "Organize with directories",
    lines: [
      "Create Directory makes a new folder — one per language or topic works well.",
      "Use the Show folder selector to switch between directories.",
      "A directory has to be empty before it can be deleted.",
    ],
  },
  {
    icon: "➕",
    title: "Add words",
    lines: [
      "Add Word opens a form: pick the target directory, then fill in the word and its meaning.",
      "Kundoku, Ondoku and Pronunciation are optional — they are mainly useful for Japanese.",
      "Tick the Learned checkbox in the table to track your progress, or select rows and press Delete Word.",
    ],
  },
  {
    icon: "✍️",
    title: "Create example sentences",
    lines: [
      "The + button on a row generates example sentences for that word.",
      "Choose the language to translate into and a tone — Formal, Casual or Friendly — then save the sentences you want to keep.",
      "📄 shows the sentences saved for one word; Sentence Lists in the menu shows all of them.",
    ],
  },
  {
    icon: "🎯",
    title: "Test yourself",
    lines: [
      "Open the menu and choose Test.",
      "Pick a directory, choose multiple choice or free text, then set how many questions and how long you get.",
      "After finishing you can save the result and review it later from the same screen.",
    ],
  },
  {
    icon: "🌐",
    title: "Share and settings",
    lines: [
      "Shared folder lets you publish one of your directories, or copy another user's directory into your own.",
      "Settings holds your profile, logout and account deletion.",
      "Need this guide again? Menu → How to use.",
    ],
  },
];

export default function OnboardingGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  // always restart from the first slide when the guide is opened
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight")
        setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
      if (event.key === "ArrowLeft") setStepIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div
      style={styles.overlay}
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How to use this app"
    >
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.stepCount}>
            {stepIndex + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={styles.skipButton}
            aria-label="Close guide"
          >
            Skip ✕
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.icon}>{step.icon}</div>
          <h2 style={styles.title}>{step.title}</h2>
          <ul style={styles.list}>
            {step.lines.map((line) => (
              <li key={line} style={styles.listItem}>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.dots}>
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setStepIndex(i)}
              aria-label={`Go to step ${i + 1}`}
              style={{
                ...styles.dot,
                ...(i === stepIndex ? styles.dotActive : {}),
              }}
            />
          ))}
        </div>

        <div style={styles.footer}>
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              visibility: isFirst ? "hidden" : "visible",
            }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() =>
              isLast ? onClose() : setStepIndex((i) => i + 1)
            }
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            {isLast ? "Get started 🚀" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 1200,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 18,
    width: 560,
    maxWidth: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
    fontFamily: "'Noto Sans', 'Inter', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px 0",
  },
  stepCount: {
    fontSize: 13,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  skipButton: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: 4,
  },
  body: {
    padding: "8px 28px 4px",
    textAlign: "center",
  },
  icon: {
    fontSize: 46,
    lineHeight: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 16px",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textAlign: "left",
  },
  listItem: {
    fontSize: 14.5,
    lineHeight: 1.65,
    color: "#475569",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 14px",
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    padding: "20px 0 4px",
  },
  dot: {
    width: 8,
    height: 8,
    padding: 0,
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#cbd5e1",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  dotActive: {
    width: 22,
    borderRadius: 999,
    backgroundColor: "#03a9fc",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "12px 20px 20px",
  },
  button: {
    padding: "11px 20px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  primaryButton: {
    backgroundColor: "#03a9fc",
    color: "#fff",
    border: "none",
    minWidth: 130,
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
  },
};
