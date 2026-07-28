"use client";

import { useEffect, useMemo, useState } from "react";
import { api, useAccessToken } from "@/lib/api";
import { fetchAllWords, fetchWordCount } from "@/lib/words";
import type { WordEntry, WordFolder } from "../../../../types/contents";
import { useSearchParams } from "next/navigation";

type Phase = "config" | "quiz" | "results";

interface QuizConfiguration {
  folderId: number | null;
  mode: "objective" | "subjective";
  numberOfQuestions: number;
  timeLimitMinutes: number; // minutes
}

interface ObjectiveQuizQuestion {
  questionText: string; // word
  answers: string[]; // 4 choices
  correctAnswerIndex: number;
}

interface SubjectiveQuizQuestion {
  questionText: string; // word
  correctAnswer: string; // meaning
}

type QuizQuestion = ObjectiveQuizQuestion | SubjectiveQuizQuestion;

interface QuizResultRow {
  questionText: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
}

interface SavedQuizResult {
  ts: string;
  config?: QuizConfiguration;
  results: QuizResultRow[];
  correctCount: number;
  total: number;
}

type StylesType = {
  container: React.CSSProperties;
  card: React.CSSProperties;
  title: React.CSSProperties;
  subtitle: React.CSSProperties;
  formSection: React.CSSProperties;
  formLabel: React.CSSProperties;
  row: React.CSSProperties;
  rowCenter: React.CSSProperties;
  select: React.CSSProperties;
  input: React.CSSProperties;
  modeButtonGroup: React.CSSProperties;
  modeButton: (isActive: boolean) => React.CSSProperties;
  button: React.CSSProperties;
  gauge: React.CSSProperties;
  gaugeFill: (pct: number) => React.CSSProperties;
  quizHeader: React.CSSProperties;
  options: React.CSSProperties;
  optionBtn: React.CSSProperties;
  textInput: React.CSSProperties;
  navRow: React.CSSProperties;
  secondaryBtn: React.CSSProperties;
  resultRow: React.CSSProperties;
  revealBtn: React.CSSProperties;
  constraintText: React.CSSProperties;
};

export default function QuizPage(props: { userId: string; authToken: string }) {
  const { userId, authToken } = props;
  useAccessToken(authToken);

  const searchParams = useSearchParams();
  const wordFolders = JSON.parse(searchParams.get("wordFolders") || "[]");

  // Data
  const [folders, setFolders] = useState<WordFolder[]>(wordFolders ?? []);

  // Config + quiz state
  const [phase, setPhase] = useState<Phase>("config");
  const [config, setConfig] = useState<QuizConfiguration>({
    folderId: null,
    mode: "objective",
    numberOfQuestions: 10,
    timeLimitMinutes: 5,
  });
  const [maxAvailableQuestions, setMaxAvailableQuestions] = useState(0);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Saved results viewer
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [savedResults, setSavedResults] = useState<SavedQuizResult[]>([]);

  // Only the count is needed to bound the "number of questions" input, so this
  // asks for a single row and reads totalElements instead of pulling the folder.
  const loadWordCount = async (folderId: number) => {
    try {
      const count = await fetchWordCount(folderId);
      setMaxAvailableQuestions(count);
      setConfig((c) => ({
        ...c,
        numberOfQuestions: Math.min(c.numberOfQuestions, count),
      }));
    } catch (e) {
      console.error("Fetch word count error", e);
      setMaxAvailableQuestions(0);
    }
  };

  // Load folders if not provided
  useEffect(() => {
    const loadFolders = async () => {
      if (folders.length > 0) return;
      console.log("Loading folders from server...");
      try {
        const resp = await api.get(`/folder/getfolderUser/${userId}`);
        const list: WordFolder[] = resp.data ?? [];
        setFolders(list);
        if (list.length > 0) {
          const firstFolderId = list[0].id;
          setConfig((c) => ({ ...c, folderId: firstFolderId }));
          await loadWordCount(firstFolderId);
        }
      } catch (err) {
        console.error("Load folders error", err);
      }
    };
    loadFolders();
  }, [authToken, userId]);

  // Load saved results from localStorage (cookies are limited to ~4KB)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("quiz_results");
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedResults(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // ignore
    }
  }, []);

  // State for expanding saved result details
  const [expandedResultIdx, setExpandedResultIdx] = useState<number | null>(
    null,
  );

  const styles = useMemo(
    () => ({
      container: {
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 20%, #e0f2fe 0, #ffffff 35%)",
        padding: 20,
      },
      card: {
        maxWidth: 1000,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        padding: 40,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      },
      title: {
        fontSize: 32,
        fontWeight: 800,
        color: "#1f2937",
        marginBottom: 8,
      },
      subtitle: {
        fontSize: 15,
        color: "#6b7280",
        marginBottom: 32,
      },
      formSection: {
        marginBottom: 32,
      },
      formLabel: {
        display: "block",
        fontSize: 14,
        fontWeight: 700,
        color: "#374151",
        marginBottom: 12,
        textTransform: "uppercase" as const,
        letterSpacing: 0.5,
      },
      row: {
        display: "flex",
        gap: 16,
        alignItems: "center",
        marginTop: 0,
        flexWrap: "wrap" as const,
      },
      rowCenter: {
        display: "flex",
        gap: 16,
        alignItems: "center",
        justifyContent: "center",
      },
      select: {
        padding: "12px 16px",
        borderRadius: 10,
        border: "2px solid #e5e7eb",
        fontSize: 14,
        fontWeight: 600,
        backgroundColor: "#f9fafb",
        cursor: "pointer",
        transition: "all 0.2s",
        minWidth: 220,
      },
      input: {
        padding: "12px 16px",
        borderRadius: 10,
        border: "2px solid #e5e7eb",
        fontSize: 14,
        fontWeight: 600,
        backgroundColor: "#f9fafb",
        width: 120,
        transition: "all 0.2s",
      },
      modeButtonGroup: {
        display: "flex",
        gap: 10,
      },
      modeButton: (isActive: boolean) => ({
        padding: "12px 24px",
        borderRadius: 10,
        border: "2px solid",
        borderColor: isActive ? "#667eea" : "#e5e7eb",
        fontSize: 14,
        fontWeight: 700,
        backgroundColor: isActive ? "#667eea" : "#f9fafb",
        color: isActive ? "#ffffff" : "#374151",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isActive ? "0 6px 20px rgba(102, 126, 234, 0.3)" : "none",
      }),
      button: {
        padding: "14px 32px",
        borderRadius: 10,
        border: "none",
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        background: "linear-gradient(135deg,#667eea,#764ba2)",
        color: "#fff",
        transition: "all 0.2s ease",
        boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
      },
      gauge: {
        height: 12,
        background: "#e5e7eb",
        borderRadius: 999,
        overflow: "hidden",
        marginBottom: 16,
      },
      gaugeFill: (pct: number) => ({
        height: "100%",
        width: `${pct}%`,
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        transition: "width 0.3s ease",
      }),
      quizHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        color: "#1f2937",
        fontSize: 15,
        fontWeight: 700,
      },
      options: {
        display: "grid",
        gap: 12,
        gridTemplateColumns: "1fr",
        marginTop: 20,
      },
      optionBtn: {
        padding: "14px 16px",
        borderRadius: 10,
        border: "2px solid #e5e7eb",
        cursor: "pointer",
        background: "#f9fafb",
        textAlign: "left" as const,
        fontSize: 14,
        fontWeight: 600,
        transition: "all 0.2s ease",
      },
      textInput: {
        padding: "12px 16px",
        borderRadius: 10,
        border: "2px solid #e5e7eb",
        width: "100%",
        fontSize: 14,
        fontWeight: 600,
      },
      navRow: {
        display: "flex",
        gap: 12,
        marginTop: 24,
        justifyContent: "flex-end",
      },
      secondaryBtn: {
        padding: "12px 20px",
        borderRadius: 10,
        border: "2px solid #e5e7eb",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 14,
        transition: "all 0.2s ease",
      },
      resultRow: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        backgroundColor: "#f9fafb",
      },
      revealBtn: {
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        background: "#f3f4f6",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 13,
        transition: "all 0.2s ease",
      },
      constraintText: {
        fontSize: 12,
        color: "#9ca3af",
        marginTop: 6,
      },
    }),
    [],
  );

  // The quiz samples questions and builds distractors from the whole folder,
  // so this is one of the few places that legitimately needs every word.
  const fetchWords = async (folderId: number): Promise<WordEntry[]> => {
    try {
      return await fetchAllWords(folderId);
    } catch (e) {
      console.error("Fetch words error", e);
      alert("Failed to fetch words.");
      return [];
    }
  };

  const buildQuestions = (
    list: WordEntry[],
    cfg: QuizConfiguration,
  ): QuizQuestion[] => {
    const pool = [...list];
    const count = Math.min(cfg.numberOfQuestions, pool.length);
    const result: QuizQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const pickedIndex = Math.floor(Math.random() * pool.length);
      const picked = pool.splice(pickedIndex, 1)[0];
      if (!picked) break;
      const questionText = picked.word;

      if (cfg.mode === "objective") {
        const answers: string[] = [picked.meaning];
        const distractorPool = list.filter((w) => w.id !== picked.id);
        while (answers.length < 4 && distractorPool.length > 0) {
          const d = distractorPool.splice(
            Math.floor(Math.random() * distractorPool.length),
            1,
          )[0];
          if (d && !answers.includes(d.meaning)) answers.push(d.meaning);
        }
        // pad with placeholders if not enough unique meanings
        while (answers.length < 4) answers.push("(no option)");
        // shuffle
        for (let j = answers.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [answers[j], answers[k]] = [answers[k], answers[j]];
        }
        const correctAnswerIndex = answers.indexOf(picked.meaning);
        result.push({ questionText, answers, correctAnswerIndex });
      } else {
        result.push({ questionText, correctAnswer: picked.meaning });
      }
    }
    return result;
  };

  const startQuiz = async () => {
    if (!config.folderId) {
      alert("Please select a folder.");
      return;
    }
    const list = await fetchWords(config.folderId);
    if (list.length === 0) {
      alert("Selected folder has no words.");
      return;
    }
    const qs = buildQuestions(list, config);
    setQuestions(qs);
    setAnswers(Array(qs.length).fill(null));
    setCurrentIndex(0);
    setRemainingSeconds(config.timeLimitMinutes * 60);
    setPhase("quiz");
  };

  // timer
  useEffect(() => {
    if (phase !== "quiz") return;
    if (remainingSeconds <= 0) {
      finalize();
      return;
    }
    const id = setInterval(() => {
      setRemainingSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, remainingSeconds]);

  const selectObjectiveAnswer = (idx: number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = String(idx);
      return copy;
    });
  };

  const setSubjectiveAnswer = (val: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = val;
      return copy;
    });
  };

  const next = () => {
    const answer = answers[currentIndex];
    const unanswered =
      answer === null || (typeof answer === "string" && answer.trim() === "");
    if (unanswered) {
      const ok = window.confirm(
        "You haven't answered this question yet. Skip it anyway?",
      );
      if (!ok) return;
    }
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
    else finalize();
  };

  const finalize = () => {
    setPhase("results");
  };

  const results: QuizResultRow[] = useMemo(() => {
    if (phase === "config") return [];
    return questions.map((q, i) => {
      if ("answers" in q) {
        const userIdx = answers[i] ? parseInt(String(answers[i]), 10) : -1;
        const ua = userIdx >= 0 ? q.answers[userIdx] : null;
        const ca = q.answers[q.correctAnswerIndex];
        return {
          questionText: q.questionText,
          correctAnswer: ca,
          userAnswer: ua,
          isCorrect: ua === ca,
        };
      } else {
        const ua = answers[i] ?? null;
        const ca = q.correctAnswer;
        return {
          questionText: q.questionText,
          correctAnswer: ca,
          userAnswer: ua,
          isCorrect:
            (ua ?? "").trim().toLowerCase() === ca.trim().toLowerCase(),
        };
      }
    });
  }, [phase, questions, answers]);

  const correctCount = results.filter((r) => r.isCorrect).length;

  const saveResults = () => {
    const entry = {
      ts: new Date().toISOString(),
      config,
      results,
      correctCount,
      total: results.length,
    };
    try {
      const raw = window.localStorage.getItem("quiz_results");
      let arr: SavedQuizResult[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        arr = Array.isArray(parsed) ? parsed : [];
      }
      arr.unshift(entry);
      if (arr.length > 10) arr = arr.slice(0, 10);
      window.localStorage.setItem("quiz_results", JSON.stringify(arr));
      setSavedResults(arr);
      alert("Quiz results have been saved.");
    } catch {
      alert("Failed to save results.");
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // UI
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {phase === "config" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <div>
                <h1 style={styles.title}>📚 Quiz Configuration</h1>
                <p style={styles.subtitle}>
                  Select a word folder and quiz options.
                </p>
              </div>
              <button
                style={{
                  ...styles.secondaryBtn,
                  padding: "10px 16px",
                  fontSize: 14,
                  marginTop: 4,
                }}
                onClick={() => {
                  window.location.href = "/";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                ← Back
              </button>
            </div>

            {/* Folder Selection */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>📁 Word Folder</label>
              <select
                style={styles.select}
                value={config.folderId ?? ""}
                onChange={async (e) => {
                  const folderId = e.target.value
                    ? parseInt(e.target.value, 10)
                    : null;
                  setConfig((c) => ({ ...c, folderId }));
                  if (folderId) {
                    await loadWordCount(folderId);
                  } else {
                    setMaxAvailableQuestions(0);
                  }
                }}
              >
                <option value="">-- Select Folder --</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {maxAvailableQuestions > 0 && (
                <div style={styles.constraintText}>
                  Available: {maxAvailableQuestions} words
                </div>
              )}
            </div>

            {/* Mode Selection (Toggle Buttons) */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>❓ Question Type</label>
              <div style={styles.modeButtonGroup}>
                <button
                  style={styles.modeButton(config.mode === "objective")}
                  onClick={() =>
                    setConfig((c) => ({ ...c, mode: "objective" }))
                  }
                  onMouseEnter={(e) => {
                    if (config.mode !== "objective") {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (config.mode !== "objective") {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                >
                  4 Choices (Objective)
                </button>
                <button
                  style={styles.modeButton(config.mode === "subjective")}
                  onClick={() =>
                    setConfig((c) => ({ ...c, mode: "subjective" }))
                  }
                  onMouseEnter={(e) => {
                    if (config.mode !== "subjective") {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (config.mode !== "subjective") {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                >
                  Free Text (Subjective)
                </button>
              </div>
            </div>

            {/* Number of Questions & Time Limit */}
            <div style={styles.formSection}>
              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.formLabel}>📝 Number of Questions</label>
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={maxAvailableQuestions || 50}
                    value={config.numberOfQuestions}
                    onChange={(e) => {
                      const val = Math.max(
                        1,
                        Math.min(
                          maxAvailableQuestions || 50,
                          parseInt(e.target.value || "1", 10),
                        ),
                      );
                      setConfig((c) => ({
                        ...c,
                        numberOfQuestions: val,
                      }));
                    }}
                  />
                  {maxAvailableQuestions > 0 && (
                    <div style={styles.constraintText}>
                      Max: {maxAvailableQuestions}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.formLabel}>⏱ Time Limit (minutes)</label>
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={120}
                    value={config.timeLimitMinutes}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        timeLimitMinutes: Math.max(
                          1,
                          parseInt(e.target.value || "1", 10),
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div style={{ marginTop: 32 }}>
              <button
                style={{
                  ...styles.button,
                  opacity: config.folderId ? 1 : 0.5,
                  cursor: config.folderId ? "pointer" : "not-allowed",
                  width: "100%",
                  padding: "16px 32px",
                  fontSize: 16,
                }}
                onClick={startQuiz}
                disabled={!config.folderId}
                onMouseEnter={(e) => {
                  if (config.folderId) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 28px rgba(102, 126, 234, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(102, 126, 234, 0.3)";
                }}
              >
                🚀 Start Quiz
              </button>
            </div>

            {/* Saved Results Viewer */}
            <div style={{ marginTop: 32 }}>
              <button
                style={styles.secondaryBtn}
                onClick={() => setShowSavedPanel((v) => !v)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#c7d2fe";
                  e.currentTarget.style.backgroundColor = "#f0f4ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                📋 {showSavedPanel ? "Hide" : "View"} Saved Results (
                {savedResults.length})
              </button>
              {showSavedPanel && (
                <div style={{ marginTop: 16 }}>
                  {savedResults.length === 0 && (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: 14,
                      }}
                    >
                      No saved results yet.
                    </div>
                  )}
                  {savedResults.map((r, idx) => (
                    <div key={idx}>
                      <button
                        style={{
                          ...styles.resultRow,
                          backgroundColor: "#f0f9ff",
                          borderColor: "#bfdbfe",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() =>
                          setExpandedResultIdx(
                            expandedResultIdx === idx ? null : idx,
                          )
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e0f2fe";
                          e.currentTarget.style.borderColor = "#7dd3fc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f0f9ff";
                          e.currentTarget.style.borderColor = "#bfdbfe";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "#1f2937",
                                fontSize: 14,
                              }}
                            >
                              {new Date(r.ts).toLocaleString()}
                            </div>
                            <div
                              style={{
                                color: "#6b7280",
                                fontSize: 13,
                                marginTop: 4,
                              }}
                            >
                              ✅ {r.correctCount} / {r.total} correct • Mode:{" "}
                              <strong>{r?.config?.mode}</strong>
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 18,
                              transform:
                                expandedResultIdx === idx
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          >
                            ▼
                          </div>
                        </div>
                      </button>

                      {expandedResultIdx === idx && r.results && (
                        <div style={{ marginTop: 12 }}>
                          {r.results.map(
                            (resultItem: QuizResultRow, rIdx: number) => (
                              <ResultRow
                                key={rIdx}
                                row={resultItem}
                                index={rIdx + 1}
                                styles={styles}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {phase === "quiz" && (
          <div>
            <div style={styles.gauge}>
              <div
                style={styles.gaugeFill(
                  ((currentIndex + 1) / questions.length) * 100,
                )}
              />
            </div>
            <div style={styles.quizHeader}>
              <div>
                Question {currentIndex + 1} / {questions.length}
              </div>
              <div>⏱ {formatTime(remainingSeconds)}</div>
            </div>

            {(() => {
              const q = questions[currentIndex];
              if ("answers" in q) {
                return (
                  <div style={{ marginTop: 28 }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#1f2937",
                        marginBottom: 20,
                      }}
                    >
                      {q.questionText}
                    </div>
                    <div style={styles.options}>
                      {q.answers.map((opt, i) => (
                        <button
                          key={i}
                          style={{
                            ...styles.optionBtn,
                            borderColor:
                              answers[currentIndex] === String(i)
                                ? "#667eea"
                                : "#e5e7eb",
                            background:
                              answers[currentIndex] === String(i)
                                ? "#eef2ff"
                                : "#f9fafb",
                            boxShadow:
                              answers[currentIndex] === String(i)
                                ? "0 4px 12px rgba(102, 126, 234, 0.2)"
                                : "none",
                          }}
                          onClick={() => selectObjectiveAnswer(i)}
                          onMouseEnter={(e) => {
                            if (answers[currentIndex] !== String(i)) {
                              e.currentTarget.style.borderColor = "#d1d5db";
                              e.currentTarget.style.backgroundColor = "#f3f4f6";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (answers[currentIndex] !== String(i)) {
                              e.currentTarget.style.borderColor = "#e5e7eb";
                              e.currentTarget.style.backgroundColor = "#f9fafb";
                            }
                          }}
                        >
                          <strong style={{ color: "#667eea" }}>
                            {String.fromCharCode(65 + i)}.
                          </strong>{" "}
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div style={{ marginTop: 28 }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#1f2937",
                        marginBottom: 20,
                      }}
                    >
                      {q.questionText}
                    </div>
                    <input
                      style={{
                        ...styles.textInput,
                        padding: "14px 16px",
                        fontSize: 16,
                      }}
                      placeholder="Type your answer here..."
                      value={(answers[currentIndex] ?? "") as string}
                      onChange={(e) => setSubjectiveAnswer(e.target.value)}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#667eea";
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                    />
                  </div>
                );
              }
            })()}

            <div style={styles.navRow}>
              <button
                style={styles.secondaryBtn}
                onClick={() => setPhase("config")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                ← Cancel
              </button>
              <button
                style={styles.button}
                onClick={next}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 28px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(102, 126, 234, 0.3)";
                }}
              >
                {currentIndex < questions.length - 1 ? "Next →" : "Finish ✓"}
              </button>
            </div>
          </div>
        )}

        {phase === "results" && (
          <div>
            <h1 style={styles.title}>🎯 Quiz Results</h1>
            <p
              style={{
                ...styles.subtitle,
                fontSize: 18,
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              Correct: <span style={{ color: "#10b981" }}>{correctCount}</span>{" "}
              / {results.length}
              {correctCount === results.length && (
                <span style={{ marginLeft: 12, fontSize: 20 }}>🌟</span>
              )}
            </p>
            <div style={{ marginTop: 28 }}>
              {results.map((r, i) => (
                <ResultRow key={i} row={r} index={i + 1} styles={styles} />
              ))}
            </div>
            <div style={styles.navRow}>
              <button
                style={styles.secondaryBtn}
                onClick={() => setPhase("config")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                ← Back to Config
              </button>
              <button
                style={styles.button}
                onClick={saveResults}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 28px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(102, 126, 234, 0.3)";
                }}
              >
                💾 Save Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  row,
  index,
  styles,
}: {
  row: QuizResultRow;
  index: number;
  styles: StylesType;
}) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{
        ...styles.resultRow,
        backgroundColor: row.isCorrect ? "#f0fdf4" : "#fef2f2",
        borderColor: row.isCorrect ? "#bbf7d0" : "#fecaca",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                minWidth: 32,
                height: 32,
                borderRadius: "50%",
                background: row.isCorrect ? "#10b981" : "#ef4444",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {index}
            </div>
            <div>
              <strong style={{ color: "#1f2937" }}>{row.questionText}</strong>
              <div style={{ marginLeft: 0, marginTop: 2 }}>
                {row.isCorrect ? (
                  <span style={{ color: "#10b981", fontWeight: 700 }}>
                    ✅ Correct
                  </span>
                ) : (
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>
                    ❌ Wrong
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          style={{
            ...styles.revealBtn,
            backgroundColor: show ? "#dbeafe" : "#f3f4f6",
            borderColor: show ? "#93c5fd" : "#d1d5db",
            fontWeight: 700,
            marginTop: 4,
          }}
          onClick={() => setShow((v) => !v)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#dbeafe";
            e.currentTarget.style.borderColor = "#93c5fd";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = show
              ? "#dbeafe"
              : "#f3f4f6";
            e.currentTarget.style.borderColor = show ? "#93c5fd" : "#d1d5db";
          }}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {show && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid" + (row.isCorrect ? " #bbf7d0" : " #fecaca"),
          }}
        >
          <div style={{ marginBottom: 8, fontSize: 14 }}>
            <strong style={{ color: "#1f2937" }}>✓ Correct Answer:</strong>
            <div
              style={{
                color: "#10b981",
                fontWeight: 600,
                marginTop: 4,
                padding: "8px 12px",
                backgroundColor: "#f0fdf4",
                borderRadius: 6,
              }}
            >
              {row.correctAnswer}
            </div>
          </div>
          {!row.isCorrect && (
            <div style={{ fontSize: 14 }}>
              <strong style={{ color: "#1f2937" }}>✗ Your Answer:</strong>
              <div
                style={{
                  color: "#ef4444",
                  fontWeight: 600,
                  marginTop: 4,
                  padding: "8px 12px",
                  backgroundColor: "#fef2f2",
                  borderRadius: 6,
                }}
              >
                {row.userAnswer ?? "(no answer)"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
