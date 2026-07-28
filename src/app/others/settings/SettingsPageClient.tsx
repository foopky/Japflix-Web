"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { api, useAccessToken } from "@/lib/api";
import { getPasswordError, PASSWORD_MIN_LENGTH } from "@/lib/password";
import PasswordChecklist from "@/app/component/PasswordChecklist";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  password: string;
  role: string;
  description: string;
}

const EMPTY_PASSWORDS = { current: "", next: "", confirm: "" };

export default function SettingsPageClient({
  authToken,
  userId,
}: {
  authToken: string;
  userId: string;
}) {
  useAccessToken(authToken);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [description, setDescription] = useState("");
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get(`/api/users/${userId}`);
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
    // authToken/userId are httpOnly, so they must be cleared server-side
    try {
      await axios.post("/api/clear-token");
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    router.push("/login");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/users/${userId}`);
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
      return;
    }

    // The backend answers 200 even when it deletes nothing, so a status code is
    // not proof. Read the record back: if it is still there, the account lives.
    let stillExists = false;
    try {
      const check = await api.get(`/api/users/${userId}`);
      stillExists = Boolean(check?.data);
    } catch {
      // Gone (or unreadable) is the outcome we wanted.
    }

    if (stillExists) {
      alert(
        "Account deletion did not go through. Your account is still active — please contact support.",
      );
      return;
    }

    // clear the httpOnly session cookies on the server before leaving
    try {
      await axios.post("/api/clear-token");
    } catch (clearError) {
      console.error("Failed to clear session cookies:", clearError);
    }
    alert("Account deleted successfully.");
    router.push("/login");
    router.refresh();
  };

  const resetForm = () => {
    setDescription(user?.description || "");
    setPasswords(EMPTY_PASSWORDS);
    setError("");
    setNotice("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setNotice("");

    const descriptionChanged = description !== (user.description || "");
    const wantsPasswordChange = Boolean(
      passwords.current || passwords.next || passwords.confirm,
    );

    if (!descriptionChanged && !wantsPasswordChange) {
      setNotice("Nothing to save.");
      return;
    }

    if (wantsPasswordChange) {
      if (!passwords.current) {
        setError("Enter your current password to change it.");
        return;
      }
      const passwordError = getPasswordError(passwords.next);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (passwords.next !== passwords.confirm) {
        setError("New passwords do not match.");
        return;
      }
      if (passwords.next === passwords.current) {
        setError("New password must be different from the current one.");
        return;
      }
    }

    setIsSaving(true);
    try {
      if (descriptionChanged) {
        // PUT /api/users/{id} is a full replace that stores `password` verbatim
        // — it never hashes. Sending a plaintext value, or omitting the field,
        // writes that straight to the column and locks the account out, since
        // login compares with BCrypt. Handing back the hash we read from GET is
        // the only call that leaves the stored credential intact. Drop the
        // field here once the backend stops accepting a password on this route.
        const updatedUser = { ...user, description };
        await api.put(`/api/users/${userId}`, updatedUser);
        setUser(updatedUser);
      }

      if (wantsPasswordChange) {
        await api.put(`/api/users/${userId}/password`, {
          currentPassword: passwords.current,
          newPassword: passwords.next,
        });
        setPasswords(EMPTY_PASSWORDS);
        // The credential changed underneath this session — send the user back
        // through login rather than leaving a token tied to the old password.
        try {
          await axios.post("/api/clear-token");
        } catch (clearError) {
          console.error("Failed to clear session cookies:", clearError);
        }
        alert("Password changed. Please log in again.");
        router.push("/login");
        router.refresh();
        return;
      }

      setNotice("Saved.");
    } catch (err) {
      console.error("Failed to save settings:", err);
      // The password route reports a wrong current password as 400, not 401 —
      // a 401 would trip the refresh interceptor in src/lib/api.ts and bounce
      // the user to /login instead of showing the message.
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 400 &&
        err.response.data?.error === "INVALID_PASSWORD"
      ) {
        setError("Current password is incorrect.");
      } else {
        setError("Failed to save changes. Please try again.");
      }
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

  const isDirty =
    description !== (user.description || "") ||
    Boolean(passwords.current || passwords.next || passwords.confirm);

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

        {/* Profile + credentials, saved together */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Profile & Account</h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.infoBlock}>
              <label htmlFor="username" style={styles.label}>
                Username
              </label>
              {/* Read-only, but a real input so password managers can tie the
                  credential below to an account. */}
              <input
                type="text"
                id="username"
                name="username"
                value={user.name}
                readOnly
                autoComplete="username"
                style={{ ...styles.input, ...styles.readOnlyInput }}
              />
              <p style={styles.hint}>Your username cannot be changed.</p>
            </div>

            <div style={styles.infoBlock}>
              <label htmlFor="description" style={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
                placeholder="Enter your description"
                maxLength={200}
                disabled={isSaving}
              />
              <p style={styles.hint}>{description.length}/200</p>
            </div>

            <div style={styles.divider} />
            <h3 style={styles.subTitle}>Change Password</h3>
            <p style={styles.hint}>
              Leave these blank to keep your current password.
            </p>

            <div style={styles.infoBlock}>
              <label htmlFor="currentPassword" style={styles.label}>
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords({ ...passwords, current: e.target.value })
                }
                autoComplete="current-password"
                style={styles.input}
                placeholder="Enter your current password"
                disabled={isSaving}
              />
            </div>

            <div style={styles.infoBlock}>
              <label htmlFor="newPassword" style={styles.label}>
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwords.next}
                onChange={(e) =>
                  setPasswords({ ...passwords, next: e.target.value })
                }
                autoComplete="new-password"
                style={styles.input}
                placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
                disabled={isSaving}
              />
              <PasswordChecklist value={passwords.next} />
            </div>

            <div style={styles.infoBlock}>
              <label htmlFor="confirmNewPassword" style={styles.label}>
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                autoComplete="new-password"
                style={styles.input}
                placeholder="Re-enter your new password"
                disabled={isSaving}
              />
            </div>

            {error && <p style={styles.errorText}>{error}</p>}
            {notice && <p style={styles.noticeText}>{notice}</p>}

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={resetForm}
                style={{ ...styles.button, ...styles.secondaryButton }}
                disabled={isSaving || !isDirty}
              >
                Reset
              </button>
              <button
                type="submit"
                style={{ ...styles.button, ...styles.primaryButton }}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
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
  subTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    margin: "8px 0 20px",
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
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  readOnlyInput: {
    backgroundColor: "#f8fafc",
    color: "#475569",
    cursor: "not-allowed",
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
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#d32f2f",
    fontWeight: 600,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: "#0369a1",
    fontWeight: 600,
    marginBottom: 8,
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
