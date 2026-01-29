import Link from "next/link";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.content}>
          {/* Left Section - Developer Info */}
          <div style={styles.infoSection}>
            <p style={styles.developer}>
              Developed by <strong>CHOI JAEMIN</strong>
            </p>
            <a
              href="mailto:ckhsa03@gmail.com"
              style={styles.email}
              target="_blank"
              rel="noopener noreferrer"
            >
              ckhsa03@gmail.com
            </a>
          </div>

          {/* Right Section - Links */}
          <div style={styles.linksSection}>
            <Link href="/terms" style={styles.link}>
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div style={styles.copyright}>
          <p style={styles.copyrightText}>
            © {new Date().getFullYear()} Vocabulary App. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    backgroundColor: "#f5f5f5",
    color: "#1f2937",
    padding: "40px 20px 24px",
    marginTop: "auto",
    borderTop: "1px solid #e5e7eb",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  content: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "24px",
    marginBottom: "24px",
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  developer: {
    margin: 0,
    fontSize: "14px",
    color: "#1f2937",
  },
  email: {
    fontSize: "14px",
    color: "#0369a1",
    textDecoration: "none",
    transition: "color 0.2s ease",
  },
  linksSection: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },
  link: {
    fontSize: "14px",
    color: "#1f2937",
    textDecoration: "none",
    fontWeight: 600,
    transition: "color 0.2s ease",
    cursor: "pointer",
  },
  copyright: {
    borderTop: "1px solid #d1d5db",
    paddingTop: "20px",
    textAlign: "center",
  },
  copyrightText: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
  },
};
