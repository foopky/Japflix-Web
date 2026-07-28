"use client";

import axios from "axios";
import { publicApi, setAccessToken } from "@/lib/api";
import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 🔐 로그인 폼 데이터 타입 정의
interface LoginFormData {
  username: string;
  password: string;
}

interface ResponseData {
  jwt: string;
  userId: number;
  refreshToken: string;
}

const styles: Record<string, React.CSSProperties> = {
  // 여기에 위에서 사용한 CSS 스타일 객체 (styles)를 붙여넣으세요.
  // ... (이전에 제공된 styles 객체를 여기에 그대로 붙여넣습니다)
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

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // ChangeEvent 타입을 명시
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // FormEvent 타입을 명시하고 event.preventDefault()를 호출
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const login = async () => {
      try {
        // publicApi: a 401 here means bad credentials, not an expired token,
        // so it must not go through the refresh interceptor.
        const response = await publicApi.post(`/api/auth/login`, formData);
        return response.data;
      } catch (error) {
        console.error("Login error: ", error);
        alert("Login failed. Please check your credentials.");
      }
    };
    const handleLoginSuccess = async (responseData: ResponseData) => {
      try {
        // 1. 클라이언트가 받은 토큰을 Next.js 서버(API Route)로 전송
        await axios.post("/api/set-token", responseData);

        // 인터셉터가 쓰는 메모리 토큰도 즉시 세팅 (쿠키 왕복을 기다리지 않도록)
        setAccessToken(responseData.jwt);

        // 강제로 서버 컴포넌트 재생성 -> 쿠키가 반영된 WordbookClient가 다시 렌더링됩니다.
        router.refresh();

        // 리다이렉트 등 후속 처리는 호출하는 쪽(handleSubmit)에서 수행합니다.
      } catch (error) {
        console.error("Cookie init failed.:", error);
      }
    };

    setIsSubmitting(true);
    const responseData: ResponseData = await login();
    if (responseData) {
      await handleLoginSuccess(responseData);
      router.push("/");
    } else {
      // login failed (alert already shown) -> re-enable the form
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Login 🔐</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="username" style={styles.label}>
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            autoComplete="username"
            style={styles.input}
            placeholder="Type your username"
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
            autoComplete="current-password"
            style={styles.input}
            placeholder="Type your password"
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
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
      <p style={styles.switchLink}>
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" style={styles.link}>
          Sign up here!
        </Link>
      </p>
    </div>
  );
}
