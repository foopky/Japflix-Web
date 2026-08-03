"use client";
import { api, useAccessToken } from "@/lib/api";
import { useIsMobile } from "@/lib/responsive";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateSentencesPageProps } from "../../../../types/contents";

interface RequiredData {
  word: string;
  language: string;
  style: string;
}

interface SentenceResponse {
  sentence: string;
  meaning: string;
}

export default function CreateSentencesPage({
  authToken,
  userId,
  wordId,
  word,
}: CreateSentencesPageProps) {
  useAccessToken(authToken);
  const router = useRouter();
  const isMobile = useIsMobile();
  const [sentences, setSentences] = useState<SentenceResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [data, setData] = useState<RequiredData>({
    word: "",
    language: "",
    style: "",
  });
  useEffect(() => {
    if (word) {
      setData({
        word: String(word),
        language: "",
        style: "",
      });
    }
  }, []);
  const fetchSentences = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/create_sentences`, {
        params: {
          word: data.word,
          language: data.language,
          style: data.style,
        },
      });
      setSentences(response.data);
    } catch (error) {
      alert("Error fetching sentences.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    if (data.word.trim() && data.language.trim()) {
      fetchSentences();
    }
  };

  const saveSentenceClick = async (res: SentenceResponse, index: number) => {
    setSavingIndex(index);
    try {
      await api.post(`/sentence`, {
        wordId: Number(wordId),
        userId: Number(userId),
        sentence_text: res.sentence,
        style: data.style,
        meaning: res.meaning,
      });
      alert("Sentence saved successfully.");
      setSavedIndices(new Set([...savedIndices, index]));
    } catch (error) {
      alert("Error saving sentence.");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleStyleClick = (selectedStyle: string) => {
    setData({
      ...data,
      style: selectedStyle,
    });
  };

  const styles = {
    container: {
      // a phone can't spare a nested scroll region, and 100vh sits partly
      // behind the address bar — so let the page itself scroll instead
      height: isMobile ? "auto" : "100vh",
      minHeight: isMobile ? "100dvh" : undefined,
      display: "flex",
      flexDirection: "column" as const,
      background: "radial-gradient(circle at 20% 20%, #e0f2fe 0, #ffffff 35%)",
      overflow: isMobile ? "visible" : "hidden",
    },
    wrapper: {
      flex: "1",
      display: "flex",
      flexDirection: "column" as const,
      maxWidth: "800px",
      width: "100%",
      margin: "0 auto",
      padding: isMobile ? "16px 12px 28px" : "20px",
      overflow: isMobile ? "visible" : "auto",
    },
    backButton: {
      alignSelf: "flex-start",
      padding: "10px 14px",
      fontSize: "14px",
      fontWeight: "700",
      background: "#f8fafc",
      color: "#0f172a",
      border: "1px solid #d8dee9",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
      marginBottom: "15px",
      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
    },
    header: {
      marginBottom: "20px",
    },
    title: {
      fontSize: isMobile ? "24px" : "32px",
      fontWeight: "bold",
      color: "#0f172a",
      marginBottom: "5px",
    },
    subtitle: {
      fontSize: "14px",
      color: "#475569",
    },
    inputSection: {
      background: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      padding: isMobile ? "16px" : "25px",
      marginBottom: "20px",
    },
    formGroup: {
      marginBottom: "18px",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      fontSize: "14px",
      border: "2px solid #d1d5db",
      borderRadius: "6px",
      outline: "none",
      transition: "all 0.2s",
      boxSizing: "border-box" as const,
      backgroundColor: "#dedcdc",
    },
    styleButtonsContainer: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap" as const,
    },
    styleButton: {
      // a wider basis on a phone so three tones wrap instead of squeezing
      flex: isMobile ? "1 1 100px" : "1",
      padding: isMobile ? "10px 12px" : "10px 20px",
      fontSize: "14px",
      fontWeight: "600",
      border: "2px solid #667eea",
      borderRadius: "6px",
      background: "#ffffff",
      color: "#667eea",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    styleButtonActive: {
      // a wider basis on a phone so three tones wrap instead of squeezing
      flex: isMobile ? "1 1 100px" : "1",
      padding: isMobile ? "10px 12px" : "10px 20px",
      fontSize: "14px",
      fontWeight: "600",
      border: "2px solid #667eea",
      borderRadius: "6px",
      background: "#667eea",
      color: "#ffffff",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    createButton: {
      width: "100%",
      padding: "12px",
      fontSize: "16px",
      fontWeight: "bold",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    createButtonDisabled: {
      width: "100%",
      padding: "12px",
      fontSize: "16px",
      fontWeight: "bold",
      background: "#9ca3af",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      cursor: "not-allowed",
      transition: "all 0.2s",
    },
    createButtonLoading: {
      width: "100%",
      padding: "12px",
      fontSize: "16px",
      fontWeight: "bold",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      cursor: "wait",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
    },
    spinner: {
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
    resultsSection: {
      background: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      padding: isMobile ? "16px" : "25px",
      marginBottom: "20px",
    },
    resultsTitle: {
      fontSize: "22px",
      fontWeight: "bold",
      color: "#374151",
      marginBottom: "18px",
    },
    sentenceCard: {
      background: "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)",
      borderLeft: "4px solid #667eea",
      padding: "16px",
      borderRadius: "6px",
      marginBottom: "12px",
      transition: "all 0.2s",
    },
    sentenceContent: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "12px",
    },
    sentenceHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    sentenceNumber: {
      minWidth: "28px",
      height: "28px",
      background: "#667eea",
      color: "#ffffff",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "14px",
    },
    sentenceText: {
      flex: "1",
      color: "#374151",
      fontSize: "15px",
      lineHeight: "1.6",
      fontWeight: "500",
    },
    meaningText: {
      color: "#6b7280",
      fontSize: "14px",
      lineHeight: "1.6",
      fontStyle: "italic",
      // the indent costs too much of a narrow screen to be worth keeping
      marginLeft: isMobile ? 0 : "40px",
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "8px",
    },
    saveButton: {
      padding: "8px 20px",
      fontSize: "13px",
      fontWeight: "600",
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    saveButtonSaving: {
      padding: "8px 20px",
      fontSize: "13px",
      fontWeight: "600",
      background: "#9ca3af",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      cursor: "wait",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    saveButtonSaved: {
      padding: "8px 20px",
      fontSize: "13px",
      fontWeight: "600",
      background: "#d1d5db",
      color: "#6b7280",
      border: "none",
      borderRadius: "6px",
      cursor: "not-allowed",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    smallSpinner: {
      width: "12px",
      height: "12px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.wrapper}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={styles.backButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e2e8f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f8fafc";
          }}
        >
          ← Back
        </button>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Create Sentences</h1>
          <p style={styles.subtitle}>
            Enter a word and generate example sentences
          </p>
        </div>

        {/* Input Section */}
        <div style={styles.inputSection}>
          {/* Word Input */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Word *</label>
            <input
              type="text"
              placeholder="You should choose a word priviously from your word list."
              value={data.word}
              onChange={(e) =>
                setData({
                  ...data,
                  word: e.target.value,
                })
              }
              style={styles.input}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
              }}
              readOnly
            />
          </div>

          {/* Language Input */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Langauge to translate *</label>
            <input
              type="text"
              placeholder="e.g., English, Korean, Spanish"
              value={data.language}
              onChange={(e) =>
                setData({
                  ...data,
                  language: e.target.value,
                })
              }
              style={{ ...styles.input, backgroundColor: "#ffffff" }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
              }}
              onClick={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
              }}
            />
          </div>

          {/* Style Buttons */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Style</label>
            <div style={styles.styleButtonsContainer}>
              <button
                onClick={() => handleStyleClick("Formal")}
                style={
                  data.style === "Formal"
                    ? styles.styleButtonActive
                    : styles.styleButton
                }
                onMouseEnter={(e) => {
                  if (data.style !== "Formal") {
                    e.currentTarget.style.background = "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (data.style !== "Formal") {
                    e.currentTarget.style.background = "#ffffff";
                  }
                }}
              >
                Formal
              </button>
              <button
                onClick={() => handleStyleClick("Casual")}
                style={
                  data.style === "Casual"
                    ? styles.styleButtonActive
                    : styles.styleButton
                }
                onMouseEnter={(e) => {
                  if (data.style !== "Casual") {
                    e.currentTarget.style.background = "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (data.style !== "Casual") {
                    e.currentTarget.style.background = "#ffffff";
                  }
                }}
              >
                Casual
              </button>
              <button
                onClick={() => handleStyleClick("Friendly")}
                style={
                  data.style === "Friendly"
                    ? styles.styleButtonActive
                    : styles.styleButton
                }
                onMouseEnter={(e) => {
                  if (data.style !== "Friendly") {
                    e.currentTarget.style.background = "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (data.style !== "Friendly") {
                    e.currentTarget.style.background = "#ffffff";
                  }
                }}
              >
                Friendly
              </button>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateClick}
            disabled={!data.word.trim() || !data.language.trim() || isLoading}
            style={
              !data.word.trim() || !data.language.trim()
                ? styles.createButtonDisabled
                : isLoading
                  ? styles.createButtonLoading
                  : styles.createButton
            }
            onMouseEnter={(e) => {
              if (data.word.trim() && data.language.trim() && !isLoading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={styles.spinner}></div>
                Loading...
              </>
            ) : (
              "Create Sentences"
            )}
          </button>
        </div>

        {/* Results Section */}
        {sentences.length > 0 && (
          <div style={styles.resultsSection}>
            <h2 style={styles.resultsTitle}>Generated Sentences</h2>
            <div>
              {sentences.map((sentence, index) => {
                const isSaved = savedIndices.has(index);
                const isSaving = savingIndex === index;

                return (
                  <div
                    key={index}
                    style={styles.sentenceCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0, 0, 0, 0.1)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={styles.sentenceContent}>
                      <div style={styles.sentenceHeader}>
                        <div style={styles.sentenceNumber}>{index + 1}</div>
                        <p style={styles.sentenceText}>{sentence.sentence}</p>
                      </div>
                      <p style={styles.meaningText}>{sentence.meaning}</p>
                      <div style={styles.buttonContainer}>
                        <button
                          onClick={() => saveSentenceClick(sentence, index)}
                          disabled={isSaved || isSaving}
                          style={
                            isSaved
                              ? styles.saveButtonSaved
                              : isSaving
                                ? styles.saveButtonSaving
                                : styles.saveButton
                          }
                          onMouseEnter={(e) => {
                            if (!isSaved && !isSaving) {
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(16, 185, 129, 0.3)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSaved && !isSaving) {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }
                          }}
                        >
                          {isSaving ? (
                            <>
                              <div style={styles.smallSpinner}></div>
                              Saving...
                            </>
                          ) : isSaved ? (
                            <>✓ Saved</>
                          ) : (
                            <>💾 Save Sentence</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
