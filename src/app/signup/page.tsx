"use client";

import { publicApi } from "@/lib/api";
import { getPasswordError } from "@/lib/password";
import PasswordChecklist from "@/app/component/PasswordChecklist";
import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SignUpFormData {
  name: string;
  password: string;
  description: string;
  // The backend maps this onto a USER/ADMIN enum. It must be the name, not an
  // index — Jackson reads a number as the enum ordinal, so `1` signed everyone
  // up as ADMIN.
  role: "USER" | "ADMIN";
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "16px",
  },
  textarea: {
    resize: "vertical",
    minHeight: "80px",
  },
  button: {
    padding: "10px 15px",
    backgroundColor: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },
  switchLink: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "14px",
    color: "#666",
  },
  link: {
    color: "#0070f3",
    textDecoration: "none",
    fontWeight: "bold",
  },
};

export default function Page() {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: "",
    password: "",
    description: "",
    role: "USER",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // ChangeEvent 타입을 명시하여 타입 안정성 확보
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // FormEvent 타입을 명시하고 event.preventDefault()를 호출
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const passwordError = getPasswordError(formData.password);
    if (passwordError) {
      alert(passwordError);
      return;
    }
    if (formData.password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    const signup = async () => {
      try {
        await publicApi.post(`/api/users`, formData);
        alert("Sign up completed.");
        router.push("/login");
      } catch (error) {
        console.error("Sign up error: ", error);
        alert("Sign up failed. This username may already be taken.");
        setIsSubmitting(false);
      }
    };
    signup();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sign Up 🚀</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="username" style={styles.label}>
            Username
          </label>
          <input
            type="text"
            id="username"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="username"
            style={styles.input}
            placeholder="Enter your username"
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            style={styles.input}
            placeholder="Enter your password"
          />
          <PasswordChecklist value={formData.password} />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={styles.input}
            placeholder="Re-enter your password"
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="description" style={styles.label}>
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={{ ...styles.input, ...styles.textarea }}
            placeholder="Enter a brief description about yourself."
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(isSubmitting ? { opacity: 0.6, cursor: "not-allowed" } : {}),
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p style={styles.switchLink}>
        Already have an account?{" "}
        <Link href="/login" style={styles.link}>
          Log In here!
        </Link>
      </p>
    </div>
  );
}
