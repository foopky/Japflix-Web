"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Terms of Service</h1>
          <button onClick={() => router.push("/")} style={styles.backButton}>
            ← Back
          </button>
        </div>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Acceptance of Terms</h2>
          <p style={styles.paragraph}>
            By accessing and using this Vocabulary Application, you accept and
            agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Use License</h2>
          <p style={styles.paragraph}>
            Permission is granted to temporarily use this application for
            personal, non-commercial purposes. This is the grant of a license,
            not a transfer of title.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. User Account</h2>
          <p style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your
            account and password. You agree to accept responsibility for all
            activities that occur under your account.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Content</h2>
          <p style={styles.paragraph}>
            Users retain ownership of the vocabulary content they create. By
            sharing folders, you grant other users the right to view and use
            your shared content within the application.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Privacy</h2>
          <p style={styles.paragraph}>
            We respect your privacy and are committed to protecting your
            personal information. Your data will not be shared with third
            parties without your consent.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Limitation of Liability</h2>
          <p style={styles.paragraph}>
            This application is provided "as is" without any warranties. We
            shall not be liable for any damages arising from the use or
            inability to use this application.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Changes to Terms</h2>
          <p style={styles.paragraph}>
            We reserve the right to modify these terms at any time. Continued
            use of the application after changes constitutes acceptance of the
            new terms.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Contact</h2>
          <p style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at{" "}
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

        <div style={styles.lastUpdated}>Last updated: January 27, 2026</div>
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: "32px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottom: "2px solid #e0f2fe",
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
  },
  backButton: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d8dee9",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#475569",
    margin: 0,
  },
  emailLink: {
    color: "#0ea5e9",
    textDecoration: "none",
    fontWeight: 600,
    transition: "color 0.2s ease",
  },
  lastUpdated: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: "1px solid #e2e8f0",
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
};
