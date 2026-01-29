"use client";

import React, { FormEvent, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import type {
  WordEntry,
  WordFolder,
  WordInput,
  WordbookClientProps,
} from "../../types/contents";

export default function WordbookPage({
  authToken,
  userId,
}: WordbookClientProps) {
  const router = useRouter();
  const [words, setWords] = useState<WordEntry[]>([]);
  const [addWord, setAddWord] = useState<WordInput | null>(null);
  const [checkedWordIds, setCheckedWordIds] = useState<number[]>([]);
  const [folders, setFolders] = useState<WordFolder[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [CURRENT_DIRECTORY, setCURRENT_DIRECTORY] = useState("MY FOLDER");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const quickMenuItems = [
    "Shared folder",
    "Sentence Lists",
    "Test",
    "Settings",
  ];

  // ref for header checkbox (to support indeterminate state)
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const allChecked = words.length > 0 && checkedWordIds.length === words.length;

  // keep header checkbox indeterminate when some items are selected
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        checkedWordIds.length > 0 && checkedWordIds.length < words.length;
    }
  }, [checkedWordIds, words]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setCheckedWordIds(words.map((w) => w.id));
    } else {
      setCheckedWordIds([]);
    }
  };

  // current directory/folder shown in the table
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  // when adding a word, choose which folder to add it to
  const [addWordFolderId, setAddWordFolderId] = useState<number | null>(null);

  // show/hide Add Word modal
  const [showAddForm, setShowAddForm] = useState(false);

  // Create Directory modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [folderForm, setFolderForm] = useState<{
    name: string;
    language: string;
  }>({
    name: "",
    language: "japanese",
  });

  // fetch folders for initial load (extracted so it can be reused)
  const fetchFolders = async (): Promise<WordFolder[] | undefined> => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/folder/getfolderUser/${userId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
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

  // fetch words for a given folder id (can be reused)
  const fetchWords = async (folderId: number | null) => {
    if (!folderId) {
      setWords([]);
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/folder/getwords/${folderId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const wordEntries: WordEntry[] = response.data;
      setWords(wordEntries);
    } catch (error) {
      console.error("Failed to fetch words:", error);
      alert("Failed to fetch words.");
    }
  };

  useEffect(() => {
    fetchFolders().then((folders) => {
      if (folders && folders.length > 0) {
        // fetch words for the first folder (or currentFolderId if already set)
        const initialFolderId = currentFolderId ?? folders[0].id;
        setCurrentFolderId(initialFolderId);
        fetchWords(initialFolderId);
      }
    });
  }, [authToken, userId]);

  // keep CURRENT_DIRECTORY in sync with the selected folder name
  useEffect(() => {
    if (!currentFolderId) {
      setCURRENT_DIRECTORY("No folder selected");
      return;
    }

    const currentFolder = folders.find((f) => f.id === currentFolderId);
    if (currentFolder) {
      setCURRENT_DIRECTORY(currentFolder.name);
    } else {
      setCURRENT_DIRECTORY("MY FOLDER");
    }
  }, [currentFolderId, folders]);

  const handleAddWord = (e?: FormEvent) => {
    // when Add button clicked: open modal and initialize form model
    if (e) e.preventDefault();
    const initial: WordInput = {
      language: "japanese",
      pos: "",
      word: "",
      meaning: "",
      learned: false,
      kundoku: "",
      ondoku: "",
      pronunciation: "",
      example: "",
    };
    setAddWord(initial);
    // default target folder for new word -> currently selected folder
    setAddWordFolderId(currentFolderId ?? folders[0]?.id ?? null);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setAddWord(null);
  };

  const handleFormChange = (
    field: keyof WordInput,
    value: string | boolean | number,
  ) => {
    if (!addWord) return;
    setAddWord({ ...addWord, [field]: value } as WordInput);
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!addWord) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}/words`,
        addWord,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const created: WordEntry = response?.data || {
        id: Date.now(),
        ...addWord,
      };
      // if user selected a folder to attach this word to, call addwordtofolder
      if (addWordFolderId) {
        try {
          const lang = (created.language || addWord.language || "english")
            .toString()
            .toLowerCase();
          await axios.post(
            `${
              process.env.NEXT_PUBLIC_API_HOST
            }/folder/addwordtofolder/${encodeURIComponent(lang)}/${
              created.id
            }/${addWordFolderId}`,
            {},
            {
              headers: {
                Accept: "*/*",
                Authorization: `Bearer ${authToken}`,
              },
            },
          );
          // if the created word was added to the currently displayed folder, refresh list
          if (addWordFolderId === currentFolderId && currentFolderId) {
            await fetchWords(currentFolderId);
          }
        } catch (err) {
          console.error("addwordtofolder failed:", err);
          alert("Failed to add word to folder.");
        }
      }
      // setWords((prev) => [created, ...prev]);
      setShowAddForm(false);
      setAddWord(null);
      alert("Word successfully added.");
    } catch (error) {
      console.error("Word add error: ", error);
      alert("Word add failed.");
    }
  };

  // when user selects a folder to view, update currentFolderId and reload words
  const handleSelectFolderForView = async (folderId: number | null) => {
    setCurrentFolderId(folderId);
    setCurrentPage(1);
    if (folderId === null) {
      setWords([]);
      return;
    }
    await fetchWords(folderId);
  };

  // --- Create Directory handlers ---
  const handleCreateDirectory = () => {
    setFolderForm({ name: "", language: "japanese" });
    setShowCreateModal(true);
  };

  const handleCreateFormChange = (
    field: "name" | "language",
    value: string,
  ) => {
    setFolderForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitCreateDirectory = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!folderForm.name.trim()) {
      alert("폴더 이름을 입력하세요.");
      return;
    }
    try {
      setCreating(true);
      // POST to backend (matches the curl you provided)
      const url = `${
        process.env.NEXT_PUBLIC_API_HOST
      }/folder/wordfolder?user_id=${encodeURIComponent(userId)}`;
      const response = await axios.post(
        url,
        {
          name: folderForm.name,
          language: folderForm.language,
        },
        {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      // refresh folder list after creation
      await fetchFolders();
      setShowCreateModal(false);
      alert("Directory created.");
    } catch (error) {
      console.error("Create directory error:", error);
      alert("Directory creation failed.");
    } finally {
      setCreating(false);
    }
  };
  const handleDeleteWord = () => {
    if (checkedWordIds.length === 0) {
      alert("Please select at least one word to delete.");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete the selected ${checkedWordIds.length} words?`,
      )
    ) {
      for (const id of checkedWordIds) {
        axios.delete(`${process.env.NEXT_PUBLIC_API_HOST}/words`, {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            wordId: id,
            folderId: currentFolderId,
          },
        });
      }

      const newWords = words.filter(
        (word) => !checkedWordIds.includes(word.id),
      );
      setWords(newWords);
      setCheckedWordIds([]);
      alert("Words deleted.");
    }
  };

  const handleCheckboxChange = (id: number, checked: boolean) => {
    setCheckedWordIds((prevIds) => {
      if (checked) {
        return [...prevIds, id];
      } else {
        return prevIds.filter((wordId) => wordId !== id);
      }
    });
  };

  const handleDeleteDirectory = async () => {
    if (!currentFolderId) {
      alert("No directory to delete.");
      return;
    }
    const folder = folders.find((f) => f.id === currentFolderId);
    const folderName = folder?.name ?? `folder ${currentFolderId}`;
    if (words.length > 0) {
      alert("Please delete all words in the directory before deleting it.");
      return;
    }
    const ok = window.confirm(
      `Are you sure you want to delete the directory "${folderName}"?`,
    );
    if (!ok) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/folder/${currentFolderId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const updated = await fetchFolders();
      if (updated && updated.length > 0) {
        const newId = updated[0].id;
        setCurrentFolderId(newId);
      } else {
        setCurrentFolderId(null);
        setWords([]);
      }
      alert("Directory deleted.");
    } catch (err) {
      console.error("Delete directory failed:", err);
      alert("Directory deletion failed.");
    }
  };

  const handleQuickMenuSelect = (label: string) => {
    if (label === "Shared folder") {
      const query = new URLSearchParams({
        wordFolders: JSON.stringify(folders),
      });
      router.push(`/others/shared-folder?${query.toString()}`);
    } else if (label === "Sentence Lists") {
      const query = new URLSearchParams({
        wordFolders: JSON.stringify(folders),
      });
      router.push(`/others/view-sentences?${query.toString()}`);
    } else if (label === "Test") {
      const query = new URLSearchParams({
        wordFolders: JSON.stringify(folders),
      });
      router.push(`/others/quiz?${query.toString()}`);
    } else if (label === "Chrome Extension") {
    } else if (label === "Settings") {
      router.push(`/others/settings`);
    }
    setIsMenuOpen(false);
  };

  const handleCreateSentence = (entry: WordEntry) => {
    const query = new URLSearchParams({
      word: entry.word,
      wordId: entry.id.toString(),
    });
    router.push(`/others/create-sentences?${query.toString()}`);
  };

  const handleViewSentence = (entry: WordEntry) => {
    const query = new URLSearchParams({
      wordId: entry.id.toString(),
    });
    router.push(`/others/view-sentences?${query.toString()}`);
  };

  const handleLearnedClick = (word: WordEntry) => {
    word.learned = !word.learned;
    setWords([...words]);
    axios.put(`${process.env.NEXT_PUBLIC_API_HOST}/words`, word, {
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${authToken}`,
      },
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(words.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWords = words.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div style={styles.container}>
      <div style={styles.menuWrapper} ref={menuRef}>
        <button
          type="button"
          aria-label="Toggle quick menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          style={{
            ...styles.menuButton,
            ...(isMenuOpen ? styles.menuButtonActive : {}),
          }}
        >
          <span style={styles.menuIconLine} />
          <span style={styles.menuIconLine} />
          <span style={styles.menuIconLine} />
        </button>
        {isMenuOpen && (
          <div style={styles.menuDropdown}>
            {quickMenuItems.map((label) => (
              <button
                type="button"
                key={label}
                style={styles.menuItem}
                onClick={() => handleQuickMenuSelect(label)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Top Area (Header and Buttons) */}
      <header style={styles.header}>
        <h1 style={styles.title}>My Vocabulary Web</h1>
        <div style={styles.buttonGroup}>
          <button
            onClick={handleAddWord}
            style={{ ...styles.button, ...styles.addButton }}
          >
            ➕ Add Word
          </button>
          <button onClick={handleCreateDirectory} style={styles.button}>
            📁 Create Directory
          </button>
          <button
            onClick={handleDeleteDirectory}
            style={{ ...styles.button, ...styles.deleteButton }}
            disabled={!currentFolderId}
            title={
              currentFolderId
                ? "Delete current directory"
                : "No directory to delete"
            }
          >
            🗑️ Delete Directory
          </button>
          <button
            onClick={handleDeleteWord}
            style={{ ...styles.button, ...styles.deleteButton }}
            disabled={checkedWordIds.length === 0}
          >
            🗑️ Delete Word ({checkedWordIds.length})
          </button>
        </div>
      </header>

      {/* Create Directory Modal */}
      {showCreateModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => setShowCreateModal(false)}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>Create New Directory</h3>
            </div>
            <form onSubmit={submitCreateDirectory}>
              <div style={{ ...styles.modalBody, gridTemplateColumns: "1fr" }}>
                <label style={styles.label}>
                  Name
                  <input
                    style={styles.input}
                    value={folderForm.name}
                    onChange={(e) =>
                      handleCreateFormChange("name", e.target.value)
                    }
                    required
                    placeholder="my-japanese-list"
                  />
                </label>
                <label style={styles.label}>
                  Language
                  <input
                    style={styles.input}
                    value={folderForm.language}
                    onChange={(e) =>
                      handleCreateFormChange("language", e.target.value)
                    }
                    placeholder="japanese"
                    required
                  />
                </label>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.button}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.addButton }}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {showAddForm && addWord && (
        <div style={styles.modalOverlay} onMouseDown={handleCloseForm}>
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              // prevent overlay click from closing when interacting inside modal
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>Add New Word</h3>
            </div>
            <form onSubmit={handleSubmitForm}>
              <div style={styles.modalBody}>
                <label style={styles.label}>
                  Folder
                  <select
                    style={styles.input}
                    value={addWordFolderId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAddWordFolderId(v === "" ? null : parseInt(v, 10));
                    }}
                  >
                    <option value="">-- Choose Directory --</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.language})
                      </option>
                    ))}
                  </select>
                </label>
                <label style={styles.label}>
                  Language
                  <input
                    style={styles.input}
                    value={addWord.language}
                    onChange={(e) =>
                      handleFormChange("language", e.target.value)
                    }
                  />
                </label>
                <label style={styles.label}>
                  POS
                  <input
                    style={styles.input}
                    value={addWord.pos}
                    onChange={(e) => handleFormChange("pos", e.target.value)}
                  />
                </label>
                <label style={styles.label}>
                  Word
                  <input
                    style={styles.input}
                    value={addWord.word}
                    onChange={(e) => handleFormChange("word", e.target.value)}
                    required
                  />
                </label>
                <label style={styles.label}>
                  Meaning
                  <textarea
                    style={styles.textarea}
                    value={addWord.meaning}
                    onChange={(e) =>
                      handleFormChange("meaning", e.target.value)
                    }
                  />
                </label>
                <label style={styles.inlineLabel}>
                  <input
                    type="checkbox"
                    checked={addWord.learned}
                    onChange={(e) =>
                      handleFormChange("learned", e.target.checked)
                    }
                  />{" "}
                  Learned
                </label>
                <label style={styles.label}>
                  Kundoku
                  <input
                    style={styles.input}
                    value={addWord.kundoku}
                    onChange={(e) =>
                      handleFormChange("kundoku", e.target.value)
                    }
                  />
                </label>
                <label style={styles.label}>
                  Ondoku
                  <input
                    style={styles.input}
                    value={addWord.ondoku}
                    onChange={(e) => handleFormChange("ondoku", e.target.value)}
                  />
                </label>
                <label style={styles.label}>
                  Pronunciation
                  <input
                    style={styles.input}
                    value={addWord.pronunciation}
                    onChange={(e) =>
                      handleFormChange("pronunciation", e.target.value)
                    }
                  />
                </label>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  style={styles.button}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.addButton }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* folder chooser / quick switch (optional) */}
      {folders.length > 0 && (
        <div style={{ margin: "10px 0", textAlign: "left" }}>
          <label style={{ marginRight: 8 }}>Show folder:</label>
          <select
            value={currentFolderId ?? ""}
            onChange={(e) =>
              handleSelectFolderForView(
                e.target.value === "" ? null : parseInt(e.target.value, 10),
              )
            }
          >
            <option value="">-- none --</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 📖 Word Display Area (Table and Scroll) */}
      <section style={styles.wordTableContainer}>
        {/* 🌟 Current Directory Display Area */}
        <div style={styles.directoryDisplay}>
          <span style={styles.directoryText}>
            Current Directory: <strong>{CURRENT_DIRECTORY}</strong>
          </span>
        </div>

        {/* Scrollable Table Container */}
        <div style={styles.scrollWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={{ ...styles.tableHeader, width: "3%" }}>
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    checked={allChecked}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                  />
                </th>
                <th style={{ ...styles.tableHeader, width: "10%" }}>
                  Language
                </th>
                <th style={{ ...styles.tableHeader, width: "5%" }}>Pos</th>
                <th style={{ ...styles.tableHeader, width: "15%" }}>Word</th>
                <th style={{ ...styles.tableHeader, width: "25%" }}>Meaning</th>
                <th style={{ ...styles.tableHeader, width: "5%" }}>Learned</th>
                <th style={{ ...styles.tableHeader, width: "10%" }}>Kundoku</th>
                <th style={{ ...styles.tableHeader, width: "10%" }}>Ondoku</th>
                <th style={{ ...styles.tableHeader, width: "17%" }}>
                  Pronunciation
                </th>
                <th
                  style={{
                    ...styles.tableHeader,
                    width: "10%",
                    textAlign: "center",
                  }}
                ></th>
                <th
                  style={{
                    ...styles.tableHeader,
                    width: "10%",
                    textAlign: "center",
                  }}
                >
                  View Sentence
                </th>
              </tr>
            </thead>
            <tbody>
              {currentWords.map((word) => (
                <tr key={word.id} style={styles.dataRow}>
                  <td style={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={checkedWordIds.includes(word.id)}
                      onChange={(e) =>
                        handleCheckboxChange(word.id, e.target.checked)
                      }
                    />
                  </td>
                  <td style={styles.tableCell}>{word.language}</td>
                  <td style={styles.tableCell}>{word.pos}</td>
                  <td style={styles.tableCell}>{word.word}</td>
                  <td style={styles.tableCell}>{word.meaning}</td>
                  <td style={styles.tableCell}>
                    <input
                      type="checkbox"
                      checked={word.learned}
                      onChange={() => handleLearnedClick(word)}
                    />
                  </td>
                  <td style={styles.tableCell}>{word.kundoku}</td>
                  <td style={styles.tableCell}>{word.ondoku}</td>
                  <td style={styles.tableCell}>{word.pronunciation}</td>
                  <td style={{ ...styles.tableCell, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleCreateSentence(word)}
                      style={styles.createSentenceButton}
                      title="Sentence Lists for entire word"
                    >
                      +
                    </button>
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleViewSentence(word)}
                      style={styles.viewSentenceButton}
                      title="View saved sentences for this word"
                    >
                      📄
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {words.length === 0 && (
          <div style={styles.noData}>
            There are no words in the current directory.
          </div>
        )}

        {/* Pagination */}
        {words.length > 0 && (
          <div style={styles.pagination}>
            {Array.from(
              { length: Math.min(totalPages, 10) },
              (_, i) => i + 1,
            ).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === page ? styles.pageButtonActive : {}),
                }}
              >
                {page}
              </button>
            ))}
            {totalPages > 10 && (
              <span style={styles.pageEllipsis}>
                ... ({totalPages} pages total)
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Nanum Gothic, Arial, sans-serif",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "2px solid #eee",
    paddingBottom: "10px",
  },
  title: {
    fontSize: "28px",
    color: "#333",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
  },
  menuWrapper: {
    position: "fixed",
    top: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
    zIndex: 1101,
  },
  menuButton: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    border: "none",
    backgroundImage: "linear-gradient(135deg, #0f172a, #1e293b)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.35)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  menuButtonActive: {
    transform: "scale(1.05)",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.45)",
  },
  menuIconLine: {
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  menuDropdown: {
    width: 220,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.25)",
    border: "1px solid #e2e8f0",
    backdropFilter: "blur(6px)",
  },
  menuItem: {
    width: "100%",
    border: "1px solid #d8dee9",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
    letterSpacing: 0.2,
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
  },
  button: {
    padding: "10px 15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background-color 0.2s",
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
  sectionTitle: {
    fontSize: "22px",
    color: "#555",
    marginBottom: "15px",
    borderLeft: "4px solid #0070f3",
    paddingLeft: "10px",
  },
  wordTableContainer: {
    marginBottom: "40px",
    position: "relative",
  },
  directoryDisplay: {
    textAlign: "right",
    marginBottom: "10px",
  },
  directoryText: {
    fontSize: "16px",
    color: "#0070f3",
    padding: "5px 10px",
    borderRadius: "4px",
    backgroundColor: "#e6f7ff",
  },
  scrollWrapper: {
    overflowY: "visible",
    border: "1px solid #ddd",
    borderRadius: "8px",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px", // 가로 스크롤을 위해 최소 너비 확보
  },
  headerRow: {
    backgroundColor: "#f4f4f4",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  tableHeader: {
    padding: "12px 10px",
    textAlign: "left",
    borderBottom: "2px solid #ddd",
    fontSize: "14px",
    color: "#333",
  },
  dataRow: {
    borderBottom: "1px solid #eee",
  },
  tableCell: {
    padding: "10px",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  createSentenceButton: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #03a9fc",
    backgroundColor: "#e6f7ff",
    color: "#026aa7",
    fontWeight: 700,
    cursor: "pointer",
  },
  viewSentenceButton: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #10b981",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontWeight: 700,
    cursor: "pointer",
  },
  checkboxCell: {
    padding: "10px",
    textAlign: "center",
    width: "3%",
  },
  noData: {
    textAlign: "center",
    padding: "50px",
    color: "#999",
    fontSize: "18px",
    border: "1px solid #eee",
    borderTop: "none",
  },

  // --- Pagination styles ---
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "20px",
    padding: "15px 0",
  },
  pageButton: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    minWidth: "40px",
  },
  pageButtonActive: {
    backgroundColor: "#03a9fc",
    color: "#fff",
    border: "1px solid #03a9fc",
  },
  pageEllipsis: {
    marginLeft: "8px",
    color: "#666",
    fontSize: "14px",
  },

  // --- Modal Styles ---
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
    borderRadius: 8,
    width: 680,
    maxWidth: "95%",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    padding: 0,
  },
  modalHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
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
    gap: 10,
    borderTop: "1px solid #eee",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: 13,
    color: "#333",
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
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 6,
  },
  textarea: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 6,
    minHeight: 60,
    resize: "vertical",
  },
};
