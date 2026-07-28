"use client";
import { api, useAccessToken } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  SentenceResponse,
  ViewSentencesPageProps,
} from "../../../../types/contents";

export default function ViewSentencesPage({
  userId,
  authToken,
  wordId,
}: ViewSentencesPageProps) {
  useAccessToken(authToken);
  const router = useRouter();
  const [sentences, setSentences] = useState<SentenceResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wordInfo, setWordInfo] = useState<{
    word: string;
    meaning: string;
  } | null>(null);

  const fetchWordSentences = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/sentence/by-user-and-word`, {
        params: {
          userId: userId,
          wordId: wordId,
        },
      });
      setSentences(response.data);
      if (response.data.length > 0) {
        setWordInfo({
          word: response.data[0].word.word,
          meaning: response.data[0].word.meaning,
        });
      }
    } catch (error) {
      console.error("Failed to fetch sentences:", error);
      alert("Failed to fetch sentences.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSentences = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/sentence/user/${userId}`);
      setSentences(response.data);
    } catch (error) {
      console.error("Failed to fetch sentences:", error);
      alert("Failed to fetch sentences.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (wordId && typeof wordId === "string") {
      fetchWordSentences();
    } else {
      fetchSentences();
    }
  }, [wordId]);

  const styles = {
    container: {
      minHeight: "100vh",
      background: "radial-gradient(circle at 20% 20%, #e0f2fe 0, #ffffff 35%)",
      padding: "20px",
      overflow: "auto",
    },
    wrapper: {
      maxWidth: "900px",
      margin: "0 auto",
    },
    backButton: {
      padding: "10px 14px",
      fontSize: "14px",
      fontWeight: "700" as const,
      background: "#f8fafc",
      color: "#0f172a",
      border: "1px solid #d8dee9",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
      marginBottom: "20px",
      display: "inline-block",
      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
    },
    headerSection: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "40px",
      marginBottom: "30px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
      textAlign: "center" as const,
    },
    wordTitle: {
      fontSize: "36px",
      fontWeight: "bold",
      color: "#667eea",
      marginBottom: "12px",
    },
    wordMeaning: {
      fontSize: "16px",
      color: "#6b7280",
      lineHeight: "1.6",
      fontStyle: "italic" as const,
    },
    sentencesHeaderSection: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "30px",
      marginBottom: "20px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    },
    sectionTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#374151",
      marginBottom: "8px",
    },
    sentenceCount: {
      fontSize: "14px",
      color: "#9ca3af",
      marginBottom: "0",
    },
    sentenceCard: {
      background: "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)",
      borderLeft: "5px solid #667eea",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "16px",
      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.1)",
      transition: "all 0.3s ease",
    },
    sentenceCardHover: {
      boxShadow: "0 12px 24px rgba(102, 126, 234, 0.2)",
      transform: "translateY(-4px)",
    },
    sentenceHeader: {
      display: "flex",
      alignItems: "flex-start",
      gap: "15px",
      marginBottom: "12px",
    },
    sentenceIndex: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "36px",
      height: "36px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: "16px",
      flexShrink: 0 as const,
    },
    sentenceText: {
      flex: 1,
      fontSize: "16px",
      fontWeight: "600",
      color: "#1f2937",
      lineHeight: "1.8",
    },
    meaningLabel: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#667eea",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
      marginBottom: "6px",
    },
    meaningText: {
      fontSize: "14px",
      color: "#4b5563",
      lineHeight: "1.6",
      marginLeft: "51px",
      padding: "12px 16px",
      background: "rgba(255, 255, 255, 0.7)",
      borderRadius: "8px",
    },
    styleTag: {
      display: "inline-block",
      fontSize: "11px",
      fontWeight: "700",
      padding: "4px 10px",
      borderRadius: "20px",
      backgroundColor: "#dbeafe",
      color: "#0c4a6e",
      marginLeft: "51px",
      marginTop: "8px",
    },
    noData: {
      background: "#ffffff",
      borderRadius: "12px",
      padding: "60px 40px",
      textAlign: "center" as const,
      color: "#9ca3af",
      fontSize: "16px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    },
    spinner: {
      width: "40px",
      height: "40px",
      border: "4px solid rgba(102, 126, 234, 0.3)",
      borderTop: "4px solid #667eea",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      margin: "40px auto",
    },
  };

  const hasWordId = wordId && typeof wordId === "string";

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

        {/* Header Section */}
        {hasWordId && wordInfo ? (
          <div style={styles.headerSection}>
            <h1 style={styles.wordTitle}>{wordInfo.word}</h1>
            <p style={styles.wordMeaning}>{wordInfo.meaning}</p>
          </div>
        ) : (
          <div style={styles.headerSection}>
            <h1 style={styles.wordTitle}>📚 Sentence Lists</h1>
            <p style={styles.sentenceCount}>All your saved sentences</p>
          </div>
        )}

        {/* Sentences Section */}
        <div style={styles.sentencesHeaderSection}>
          <h2 style={styles.sectionTitle}>
            {hasWordId ? "Word Sentences" : "All Sentences"}
          </h2>
          <p style={styles.sentenceCount}>
            {sentences.length}{" "}
            {sentences.length === 1 ? "sentence" : "sentences"} found
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div style={styles.spinner}></div>
        ) : sentences.length > 0 ? (
          <div>
            {sentences.map((sentence, index) => (
              <div
                key={sentence.id}
                style={styles.sentenceCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 12px 24px rgba(102, 126, 234, 0.2)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(102, 126, 234, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.sentenceHeader}>
                  <div style={styles.sentenceIndex}>{index + 1}</div>
                  <div style={styles.sentenceText}>{sentence.sentence}</div>
                </div>
                <div style={styles.meaningLabel}>Translation</div>
                <div style={styles.meaningText}>{sentence.meaning}</div>
                <div style={styles.styleTag}>Style: {sentence.style}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noData}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <p>
              {hasWordId
                ? "No sentences found for this word. Try creating one!"
                : "No sentences yet. Start by creating some sentences!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
