"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  SharedFolder,
  WordEntry,
  WordFolder,
} from "../../../../types/contents";
import { api, useAccessToken } from "@/lib/api";
import { fetchWordsPage } from "@/lib/words";
import {
  DEFAULT_MEANING_LANGUAGE,
  matchesMeaningLanguage,
  meaningLanguageName,
  meaningLanguageSuffix,
  meaningLanguagesIn,
} from "@/lib/languages";
import { useSearchParams, useRouter } from "next/navigation";

export default function SharedFolderPage(props: {
  authToken: string;
  userId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wordFolders = JSON.parse(searchParams.get("wordFolders") || "[]");

  const { authToken, userId } = props;
  useAccessToken(authToken);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]); // show shared folders area
  const [shareFolderWords, setShareFolderWords] = useState<WordEntry[]>([]); // words in selected shared folder
  const [showViewSharedModal, setShowViewSharedModal] = useState(false);
  const [selectedSharedFolderName, setSelectedSharedFolderName] = useState<
    string | null
  >(null);
  // the words modal pages through the folder instead of loading all of it
  const [sharedWordsFolderId, setSharedWordsFolderId] = useState<number | null>(
    null,
  );
  const [sharedWordsPage, setSharedWordsPage] = useState(1);
  const [sharedWordsTotalPages, setSharedWordsTotalPages] = useState(0);
  const [sharedWordsTotal, setSharedWordsTotal] = useState(0);
  const [mySharedFolders, setMySharedFolders] = useState<SharedFolder[]>([]);
  const [showMySharedModal, setShowMySharedModal] = useState(false);

  // Share Folder UI state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCreating, setShareCreating] = useState(false);
  const [shareForm, setShareForm] = useState<{
    name: string;
    language: string;
    meaningLanguage: string;
    folderId?: number;
  }>({
    name: "",
    language: "english",
    meaningLanguage: DEFAULT_MEANING_LANGUAGE,
    folderId: undefined,
  });

  // current directory/folder shown in the table
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  const [folders, setFolders] = useState<WordFolder[]>(wordFolders);
  // "" = every language; otherwise only folders whose meanings are in that one
  const [sharedLanguageFilter, setSharedLanguageFilter] = useState("");
  const [myFolderLanguageFilter, setMyFolderLanguageFilter] = useState("");

  useEffect(() => {
    if (folders.length === 0) {
      fetchFolders().then((folders) => {
        if (folders && folders.length > 0) {
          // fetch words for the first folder (or currentFolderId if already set)
          const initialFolderId = currentFolderId ?? folders[0].id;
          setCurrentFolderId(initialFolderId);
          // create/load a shared folder on first load (non-blocking)
          fetchSharedFolder();
        }
      });
    } else {
      fetchSharedFolder();
    }
  }, [authToken, userId]);

  const fetchSharedFolder = async () => {
    try {
      const response = await api.get(`/sharedFolder`);
      // backend returns created shared folder -> merge into state
      if (response?.data) {
        console.log(response.data);
        setSharedFolders(response.data);
        console.log("fetchSharedFolder response:", response.data);
      }
    } catch (err) {
      console.error("fetchSharedFolder failed:", err);
    }
  };
  const openShareModal = () => {
    const selected =
      folders.find((f) => f.id === currentFolderId) ?? folders[0] ?? null;
    setMyFolderLanguageFilter("");
    setShareForm({
      name: selected?.name ?? "",
      language: selected?.language ?? "english",
      meaningLanguage: selected?.meaningLanguage ?? DEFAULT_MEANING_LANGUAGE,
      folderId: selected?.id,
    });
    setShowShareModal(true);
  };

  const handleShareFormChange = (field: "name" | "language", value: string) => {
    setShareForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleShareFolderSelect = (folderId: number) => {
    const nextFolder = folders.find((f) => f.id === folderId);
    setShareForm((prev) => ({
      ...prev,
      folderId,
      name: nextFolder?.name ?? prev.name,
      language: nextFolder?.language ?? prev.language,
      meaningLanguage: nextFolder?.meaningLanguage ?? prev.meaningLanguage,
    }));
  };
  // the folder picked earlier may not survive the new filter, so fall back to
  // the first one that does rather than leaving an invisible folder selected
  const handleMyFolderLanguageFilter = (code: string) => {
    setMyFolderLanguageFilter(code);
    const remaining = folders.filter((f) =>
      matchesMeaningLanguage(f.meaningLanguage, code),
    );
    if (remaining.some((f) => f.id === shareForm.folderId)) return;
    if (remaining.length === 0) {
      setShareForm((prev) => ({ ...prev, folderId: undefined }));
      return;
    }
    handleShareFolderSelect(remaining[0].id);
  };
  const submitShareFolder = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!shareForm.name.trim()) {
      alert("Please enter a shared folder name.");
      return;
    }
    if (!shareForm.folderId) {
      alert("Select a folder to share.");
      return;
    }
    try {
      setShareCreating(true);
      const folderIdToShare =
        shareForm.folderId ?? currentFolderId ?? folders[0]?.id ?? 1;
      const body = {
        userId: Number(userId) || 1,
        folderId: folderIdToShare,
        name: shareForm.name,
        language: shareForm.language,
        meaningLanguage: shareForm.meaningLanguage,
      };
      const resp = await api.post(`/sharedFolder`, body);
      if (resp?.data) {
        setSharedFolders((prev) => [resp.data, ...prev]);
      }
      setShowShareModal(false);
      alert("Shared folder created.");
    } catch (err) {
      console.error("submitShareFolder failed:", err);
      alert("Failed to create shared folder.");
    } finally {
      setShareCreating(false);
    }
  };

  const loadSharedFolderWords = async (folderId: number, page: number) => {
    const result = await fetchWordsPage(folderId, page - 1);
    setShareFolderWords(result.content);
    setSharedWordsPage(result.page + 1);
    setSharedWordsTotalPages(result.totalPages);
    setSharedWordsTotal(result.totalElements);
    return result;
  };

  // fetch and show words for a shared folder (opens modal)
  const viewSharedFolderWords = async (sharedFolder: SharedFolder) => {
    // sharedFolder.id shape may vary; support either { folderId } or number
    const folderId = sharedFolder.id.folderId;
    if (!folderId) {
      alert("Invalid shared folder id.");
      return;
    }
    try {
      const result = await loadSharedFolderWords(folderId, 1);
      setSharedWordsFolderId(folderId);
      if (result.totalElements === 0) {
        // still show modal but inform user
        alert("No words in this shared folder.");
      }
      setSelectedSharedFolderName(
        sharedFolder.wordFolder?.name ?? "Shared Folder",
      );
      setShowViewSharedModal(true);
    } catch (error) {
      console.error("View shared folder words error:", error);
      alert("Failed to load shared folder words.");
    }
  };

  const changeSharedWordsPage = async (page: number) => {
    if (!sharedWordsFolderId) return;
    const target = Math.min(
      Math.max(1, page),
      Math.max(1, sharedWordsTotalPages),
    );
    if (target === sharedWordsPage) return;
    try {
      await loadSharedFolderWords(sharedWordsFolderId, target);
    } catch (error) {
      console.error("View shared folder words error:", error);
      alert("Failed to load shared folder words.");
    }
  };

  const closeSharedWordsModal = () => {
    setShowViewSharedModal(false);
    setShareFolderWords([]);
    setSelectedSharedFolderName(null);
    setSharedWordsFolderId(null);
    setSharedWordsPage(1);
    setSharedWordsTotalPages(0);
    setSharedWordsTotal(0);
  };

  const viewMySharedFolders = async () => {
    try {
      const response = await api.get(`/sharedFolder/${userId}`);
      if (!response?.data) {
        alert("No shared folders found for user.");
        return;
      }
      setMySharedFolders(response.data);
    } catch (error) {
      console.error("View my shared folders error:", error);
      alert("Failed to load my shared folders.");
    }
  };

  const deleteMySharedFolder = async (sharedFolderId: number) => {
    const ok = window.confirm(
      "Are you sure you want to delete this shared folder?",
    );
    if (!ok) return;
    try {
      await api.delete(`/sharedFolder/${userId}/${sharedFolderId}`);
      await viewMySharedFolders(); // Refresh the list after deletion
      setSharedFolders((prev) =>
        prev.filter((sf) => sf.id.folderId !== sharedFolderId),
      );
      alert("Shared folder deleted.");
    } catch (error) {
      console.error("Delete shared folder error:", error);
      alert("Failed to delete shared folder.");
    }
  };
  const openMySharedModal = async () => {
    await viewMySharedFolders();
    setShowMySharedModal(true);
  };
  const addSharedFolderToMyFolders = async (wordFolder: WordFolder) => {
    const ok = window.confirm("Add this shared folder to my word folders?");
    if (!ok) return;
    try {
      await api.post(
        `/folder/SharedFolderToMyWordFolder?userId=${userId}`,
        wordFolder,
      );
    } catch (error) {
      console.error("Add shared folder to my folders error:", error);
      alert("Failed to add shared folder to my folders.");
    }
    await fetchFolders();
  };
  const fetchFolders = async (): Promise<WordFolder[] | undefined> => {
    try {
      const response = await api.get(`/folder/getfolderUser/${userId}`);
      const folderList: WordFolder[] = response.data;
      setFolders(folderList);
      if (folderList && folderList.length > 0) {
        // set current folder to first when loaded
        setCurrentFolderId(folderList[0].id);
      } else {
        setCurrentFolderId(null);
      }
      return folderList;
    } catch (error) {
      console.error("Failed to fetch folders:", error);
      alert("Failed to fetch folders.");
    }
  };

  // only offer languages that something in the list actually uses
  const sharedMeaningLanguages = meaningLanguagesIn(
    sharedFolders.map((sf) => sf.wordFolder ?? {}),
  );
  const visibleSharedFolders = sharedFolders.filter((sf) =>
    matchesMeaningLanguage(
      sf.wordFolder?.meaningLanguage,
      sharedLanguageFilter,
    ),
  );
  const myFolderMeaningLanguages = meaningLanguagesIn(folders);
  const visibleMyFolders = folders.filter((f) =>
    matchesMeaningLanguage(f.meaningLanguage, myFolderLanguageFilter),
  );

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <button
            onClick={() => router.push("/")}
            style={styles.backButton}
            title="Back to Home"
          >
            ← Back
          </button>
          <p style={styles.kicker}>Share & Discover</p>
          <h1 style={styles.heroTitle}>Shared Folders</h1>
          <p style={styles.heroSub}>
            Share your wordbooks or bring folders from other users to study.
          </p>
        </div>
        <div style={styles.heroActions}>
          <button
            onClick={openShareModal}
            title="Create Shared Folder"
            style={{
              ...styles.button,
              ...styles.addButton,
              ...styles.primaryAction,
            }}
          >
            ➕ Create Shared Folder
          </button>
          <button
            onClick={openMySharedModal}
            style={{ ...styles.button, ...styles.secondaryAction }}
          >
            📁 My Shared Folders
          </button>
        </div>
      </div>

      <section style={styles.sharedFolderSection}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Community Shared Folders</h2>
            <p style={styles.sectionSub}>Most recently shared folders.</p>
          </div>
          {sharedMeaningLanguages.length > 0 && (
            <label style={styles.filterLabel}>
              <span>Meaning language</span>
              <select
                value={sharedLanguageFilter}
                onChange={(e) => setSharedLanguageFilter(e.target.value)}
                style={{ ...styles.select, marginTop: 0 }}
              >
                <option value="">All languages</option>
                {sharedMeaningLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {sharedFolders.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
            No shared folders have been posted yet. Be the first to share one!
          </div>
        )}
        {sharedFolders.length > 0 && visibleSharedFolders.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
            No shared folders with meanings in{" "}
            {meaningLanguageName(sharedLanguageFilter)} yet.
          </div>
        )}
        <div style={styles.folderList}>
          {visibleSharedFolders.map((folder) => (
            <div
              key={
                typeof folder.id === "object" ? folder.id.folderId : folder.id
              }
              style={styles.folderCard}
            >
              <div style={styles.folderBadge}>{folder.wordFolder.language}</div>
              <h3 style={styles.folderName}>
                {folder.wordFolder?.name ?? folder.wordFolder.name}
              </h3>
              <p style={styles.folderInfo}>
                Meaning ·{" "}
                {meaningLanguageName(folder.wordFolder?.meaningLanguage)}
              </p>
              <p style={styles.folderInfo}>
                Author · {folder.user?.name ?? "unknown"}
              </p>
              <p style={styles.folderInfo}>Created · {folder.createDate}</p>
              <p style={styles.folderInfo}>Likes · {folder.likes}</p>
              <div style={styles.cardActions}>
                <button
                  onClick={() => viewSharedFolderWords(folder)}
                  style={{
                    ...styles.button,
                    ...styles.secondaryAction,
                    flex: 1,
                  }}
                >
                  View
                </button>
                <button
                  onClick={() => addSharedFolderToMyFolders(folder.wordFolder)}
                  style={{
                    ...styles.button,
                    ...styles.successAction,
                    flex: 1,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Share Folder Modal */}
      {showShareModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => setShowShareModal(false)}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>Share Folder?</h3>
            </div>
            <form onSubmit={submitShareFolder}>
              <div style={{ ...styles.modalBody, gridTemplateColumns: "1fr" }}>
                {myFolderMeaningLanguages.length > 0 && (
                  <div style={styles.label}>
                    <span style={{ fontWeight: "bold", marginBottom: 6 }}>
                      Filter My Folders by Meaning Language
                    </span>
                    <select
                      value={myFolderLanguageFilter}
                      onChange={(e) =>
                        handleMyFolderLanguageFilter(e.target.value)
                      }
                      style={styles.select}
                    >
                      <option value="">All languages</option>
                      {myFolderMeaningLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={styles.label}>
                  <span style={{ fontWeight: "bold", marginBottom: 6 }}>
                    Select Folder to Share
                  </span>
                  <select
                    value={shareForm.folderId ?? ""}
                    onChange={(e) =>
                      handleShareFolderSelect(Number(e.target.value))
                    }
                    style={styles.select}
                  >
                    <option value="" disabled>
                      Select a folder
                    </option>
                    {visibleMyFolders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name} · {folder.language}
                        {meaningLanguageSuffix(folder.meaningLanguage, " → ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.label}>
                  <span style={{ fontWeight: "bold", marginBottom: 6 }}>
                    Name
                  </span>
                  <input
                    value={shareForm.name}
                    onChange={(e) =>
                      handleShareFormChange("name", e.target.value)
                    }
                    placeholder="Shared Folder Name"
                    style={styles.input}
                  />
                </div>
                <div style={styles.label}>
                  <span style={{ fontWeight: "bold", marginBottom: 6 }}>
                    Language
                  </span>
                  <div style={{ ...styles.input, backgroundColor: "#f8fafc" }}>
                    {shareForm.language}
                  </div>
                </div>
                <div style={styles.label}>
                  {/* set when the folder was created — shown so the sharer can
                      see which audience will find it */}
                  <span style={{ fontWeight: "bold", marginBottom: 6 }}>
                    Meaning Language
                  </span>
                  <div style={{ ...styles.input, backgroundColor: "#f8fafc" }}>
                    {meaningLanguageName(shareForm.meaningLanguage)}
                  </div>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  style={styles.button}
                  disabled={shareCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.addButton }}
                  disabled={shareCreating}
                >
                  {shareCreating ? "Creating..." : "Create Shared Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Shared Folder Words Modal */}
      {showViewSharedModal && (
        <div style={styles.modalOverlay} onMouseDown={closeSharedWordsModal}>
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>{selectedSharedFolderName ?? "Shared Folder"} - Words</h3>
            </div>
            <div style={{ padding: 12 }}>
              {shareFolderWords.length === 0 ? (
                <div style={{ padding: 20, color: "#666" }}>
                  No words in this folder.
                </div>
              ) : (
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f4f4f4" }}>
                        <th style={{ padding: 8, textAlign: "left" }}>Word</th>
                        <th style={{ padding: 8, textAlign: "left" }}>
                          Meaning
                        </th>
                        <th style={{ padding: 8, textAlign: "left" }}>POS</th>
                        <th style={{ padding: 8, textAlign: "left" }}>
                          Pronunciation
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shareFolderWords.map((w) => (
                        <tr key={w.id}>
                          <td style={{ padding: 8 }}>{w.word}</td>
                          <td style={{ padding: 8 }}>{w.meaning}</td>
                          <td style={{ padding: 8 }}>{w.pos}</td>
                          <td style={{ padding: 8 }}>{w.pronunciation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              {sharedWordsTotalPages > 1 && (
                <div style={styles.modalPager}>
                  <button
                    type="button"
                    style={styles.button}
                    disabled={sharedWordsPage <= 1}
                    onClick={() => changeSharedWordsPage(sharedWordsPage - 1)}
                  >
                    ‹ Prev
                  </button>
                  <span style={styles.modalPagerLabel}>
                    {sharedWordsPage} / {sharedWordsTotalPages} ·{" "}
                    {sharedWordsTotal} words
                  </span>
                  <button
                    type="button"
                    style={styles.button}
                    disabled={sharedWordsPage >= sharedWordsTotalPages}
                    onClick={() => changeSharedWordsPage(sharedWordsPage + 1)}
                  >
                    Next ›
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={closeSharedWordsModal}
                style={styles.button}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Shared Folders Modal */}
      {showMySharedModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => setShowMySharedModal(false)}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>My Shared Folders</h3>
            </div>
            <div style={{ padding: 12 }}>
              {mySharedFolders.length === 0 ? (
                <div style={{ padding: 12, color: "#666" }}>
                  No shared folders found.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {mySharedFolders.map((sf: SharedFolder) => {
                    const sid = sf.id.folderId;
                    return (
                      <div key={sid} style={styles.folderCard}>
                        <h4 style={{ margin: 0 }}>
                          {sf.wordFolder?.name ??
                            sf.wordFolder?.name ??
                            "Untitled"}
                        </h4>
                        <p style={styles.folderInfo}>
                          Meaning ·{" "}
                          {meaningLanguageName(sf.wordFolder?.meaningLanguage)}
                        </p>

                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            onClick={() => deleteMySharedFolder(Number(sid))}
                            style={{ ...styles.button, ...styles.deleteButton }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowMySharedModal(false)}
                style={styles.button}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 26px 48px",
    background: "radial-gradient(circle at 20% 20%, #e0f2fe 0, #ffffff 35%)",
    minHeight: "100vh",
    fontFamily: "'Noto Sans KR', 'Inter', system-ui, -apple-system, sans-serif",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    padding: "22px 24px",
    borderRadius: 18,
    background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 65%)",
    color: "#fff",
    boxShadow: "0 16px 40px rgba(14, 165, 233, 0.35)",
  },
  kicker: {
    margin: 0,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
    opacity: 0.8,
    fontWeight: 700,
  },
  heroTitle: {
    margin: "6px 0 4px",
    fontSize: 32,
    fontWeight: 800,
  },
  heroSub: {
    margin: 0,
    maxWidth: 520,
    fontSize: 15,
    opacity: 0.9,
    lineHeight: 1.5,
  },
  heroActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  backButton: {
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 12,
    transition: "background 0.2s ease",
  },
  button: {
    padding: "10px 15px",
    borderRadius: "10px",
    border: "1px solid #d8dee9",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    transition:
      "transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
  },
  addButton: {
    backgroundColor: "#03a9fc",
    color: "white",
    border: "none",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
  },
  primaryAction: {
    backgroundColor: "#22d3ee",
    color: "#0b172a",
    border: "1px solid #0ea5e9",
  },
  secondaryAction: {
    backgroundColor: "#e2e8f0",
    color: "#0f172a",
  },
  successAction: {
    backgroundColor: "#16a34a",
    color: "#f8fafc",
    border: "1px solid #15803d",
  },
  sectionTitle: {
    fontSize: "22px",
    color: "#0f172a",
    margin: 0,
    fontWeight: 800,
  },
  sectionSub: {
    margin: "6px 0 0",
    color: "#475569",
    fontSize: 14,
  },
  sharedFolderSection: {
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 30px rgba(15,23,42,0.08)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  filterLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  },
  folderList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#64748b",
    fontSize: 15,
    backgroundColor: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
  },
  folderCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "14px 16px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)",
    position: "relative",
    overflow: "hidden",
  },
  folderBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "#0ea5e9",
    border: "1px solid #0284c7",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    letterSpacing: 0.3,
    color: "#fff",
    fontWeight: 600,
  },
  folderName: {
    fontSize: 18,
    marginBottom: 10,
    color: "#0c4a6e",
    fontWeight: 800,
  },
  folderInfo: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0",
  },
  cardActions: {
    marginTop: 12,
    display: "flex",
    gap: 8,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 680,
    maxWidth: "95%",
    boxShadow: "0 18px 32px rgba(15,23,42,0.3)",
    padding: 0,
  },
  modalHeader: {
    padding: "14px 18px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalBody: {
    padding: "12px 16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    maxHeight: 420,
    overflowY: "auto",
  },
  modalFooter: {
    padding: "12px 16px",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    borderTop: "1px solid #e2e8f0",
  },
  modalPager: {
    marginRight: "auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  modalPagerLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: 600,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: 13,
    color: "#0f172a",
  },
  inlineLabel: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    paddingTop: 6,
  },
  input: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    marginTop: 6,
  },
  textarea: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    marginTop: 6,
    minHeight: 60,
    resize: "vertical",
  },
  select: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    marginTop: 6,
    backgroundColor: "#fff",
    fontSize: 14,
  },
};
