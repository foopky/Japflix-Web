"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  password: string;
  role: string;
  description: string;
}

export default function SettingsPageClient({
  authToken,
  userId,
}: {
  authToken: string;
  userId: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/users/${userId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      if (response?.data) {
        setUser(response.data);
        setDescription(response.data.description || "");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      alert("Failed to load user information.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // try {
    //   // Call logout endpoint if available
    //   await axios.post(
    //     `${process.env.NEXT_PUBLIC_API_HOST}/logout`,
    //     {},
    //     {
    //       headers: {
    //         Accept: "*/*",
    //         Authorization: `Bearer ${authToken}`,
    //       },
    //     },
    //   );
    // } catch (error) {
    //   console.error("Logout request failed:", error);
    // }

    // Clear cookies and redirect
    document.cookie = "authToken=; path=/; max-age=0";
    document.cookie = "userId=; path=/; max-age=0";
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/users/${userId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      alert("Account deleted successfully.");
      // Clear cookies and redirect
      document.cookie = "authToken=; path=/; max-age=0";
      document.cookie = "userId=; path=/; max-age=0";
      router.push("/login");
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  const handleSaveDescription = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      const updatedUser = { ...user, description };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/users/${userId}`,
        updatedUser,
        {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      setUser(updatedUser);
      setIsEditing(false);
      alert("Description updated successfully.");
    } catch (error) {
      console.error("Failed to update description:", error);
      alert("Failed to update description.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <p style={{ textAlign: "center", color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <p style={{ textAlign: "center", color: "#d32f2f" }}>
          Failed to load user information.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>Settings</h1>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={styles.backButton}
          >
            ← Back
          </button>
        </div>

        {/* User Profile Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Profile Information</h2>

          {/* Username */}
          <div style={styles.infoBlock}>
            <label style={styles.label}>Username</label>
            <div style={styles.displayValue}>{user.name}</div>
          </div>

          {/* Description - Editable */}
          <div style={styles.infoBlock}>
            <label style={styles.label}>Description</label>
            {!isEditing ? (
              <div style={styles.descriptionDisplay}>
                <p style={styles.descriptionText}>
                  {user.description || "(No description set)"}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveDescription}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={styles.textarea}
                  placeholder="Enter your description"
                  maxLength={200}
                />
                <div style={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setDescription(user.description || "");
                    }}
                    style={{ ...styles.button, ...styles.secondaryButton }}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ ...styles.button, ...styles.primaryButton }}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Account Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Account Management</h2>

          <div style={styles.actionBlock}>
            <button
              onClick={handleLogout}
              style={{ ...styles.button, ...styles.logoutButton }}
            >
              🚪 Logout
            </button>
          </div>

          <div style={styles.actionBlock}>
            <button
              onClick={handleDeleteAccount}
              style={{ ...styles.button, ...styles.dangerButton }}
            >
              🗑️ Delete Account
            </button>
            <p style={styles.warningText}>
              Warning: Deleting your account is permanent and cannot be undone.
            </p>
          </div>
        </section>

        {/* Feedback Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Feedback</h2>
          <p style={styles.feedbackText}>
            Have feedback or suggestions? Contact us at{" "}
            <a
              href="mailto:ckhsa03@gmail.com"
              style={styles.emailLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              ckhsa03@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "32px 26px",
    background: "radial-gradient(circle at 20% 20%, #e0f2fe 0, #ffffff 35%)",
    minHeight: "100vh",
    fontFamily: "'Noto Sans', 'Inter', system-ui, -apple-system, sans-serif",
  },
  content: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    color: "#0f172a",
  },
  backButton: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d8dee9",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 20,
    borderBottom: "2px solid #e0f2fe",
    paddingBottom: 12,
  },
  infoBlock: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 8,
  },
  displayValue: {
    padding: "12px 14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 15,
    color: "#0f172a",
  },
  descriptionDisplay: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  descriptionText: {
    padding: "12px 14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    color: "#475569",
    minHeight: 80,
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: 100,
    boxSizing: "border-box",
  },
  formActions: {
    display: "flex",
    gap: 10,
    marginTop: 12,
    justifyContent: "flex-end",
  },
  actionBlock: {
    marginBottom: 16,
  },
  button: {
    padding: "12px 18px",
    borderRadius: 8,
    border: "1px solid #d8dee9",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  primaryButton: {
    backgroundColor: "#03a9fc",
    color: "#fff",
    border: "none",
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
  },
  logoutButton: {
    backgroundColor: "#0ea5e9",
    color: "#fff",
    border: "none",
    width: "100%",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    width: "100%",
  },
  warningText: {
    fontSize: 13,
    color: "#d32f2f",
    marginTop: 8,
    fontStyle: "italic",
  },
  feedbackText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 1.6,
  },
  emailLink: {
    color: "#0ea5e9",
    textDecoration: "none",
    fontWeight: 600,
    transition: "color 0.2s ease",
  },
};
