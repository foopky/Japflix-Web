import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Japflix",
  description:
    "What the Japflix Chrome extension and Japflix Voca do with your data.",
};

export default function PrivacyPage() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Privacy Policy</h1>
          <Link href="/" style={styles.backButton}>
            ← Back
          </Link>
        </div>

        <p style={styles.intro}>
          This policy explains what the Japflix Chrome extension and the Japflix
          Voca web service (japflix-web.foopky.com) do with your data.
        </p>
        <p style={styles.intro}>
          If you use the extension without signing in, no data leaves your
          browser. The subtitle features work entirely on your own device.
        </p>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Information we collect</h2>
          <p style={styles.paragraph}>
            <strong style={styles.lead}>Account information.</strong> When you
            create an account and sign in, you provide a username and a
            password. These are sent over HTTPS to our server (
            <span style={styles.code}>voca-app-backend.foopky.com</span>) to
            authenticate you and to keep you signed in.
          </p>
          <p style={styles.paragraph}>
            <strong style={styles.lead}>Vocabulary you save.</strong> When you
            choose to save a word, we store the entry you submit: the word, its
            pronunciation, its part of speech, its language, the meaning, the
            kundoku and ondoku readings, the folder you filed it in, and whether
            you have marked it as learned. This is content you create, stored
            under your account so that you can review it on the web.
          </p>
          <p style={styles.paragraph}>
            <strong style={styles.lead}>Word meaning lookups.</strong> To
            pre-fill the meaning field, the extension sends the word&apos;s
            dictionary form, its reading, and the target language you selected
            in the extension popup. It does <strong>not</strong> send the
            subtitle line the word appeared in, the title you are watching, or
            any other page content.
          </p>
          <p style={styles.paragraph}>
            <strong style={styles.lead}>
              Settings stored on your device only.
            </strong>{" "}
            The extension keeps the following in your browser&apos;s local
            extension storage: your chosen subtitle language, whether furigana
            is shown, subtitle size and word spacing, your sign-in tokens and
            user id with their expiry times, and a local copy of your saved
            words. These values stay on your device and are not transmitted
            anywhere except as described above.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Information we do not collect</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Your browsing history, or any record of which titles you watch
            </li>
            <li style={styles.listItem}>
              Page content other than the subtitle text needed to render the
              study subtitle
            </li>
            <li style={styles.listItem}>
              Analytics, telemetry, advertising identifiers, or tracking of any
              kind — the extension contains no analytics or tracking code
            </li>
            <li style={styles.listItem}>Payment information</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            3. How the extension operates on Netflix
          </h2>
          <p style={styles.paragraph}>
            The extension runs only on netflix.com. On a watch page it reads the
            subtitle track the player displays and the subtitle manifest Netflix
            loads, so that it can show the Japanese line word by word together
            with the official translation in the language you selected.
          </p>
          <p style={styles.paragraph}>
            Subtitle files are downloaded from Netflix&apos;s own servers (
            <span style={styles.code}>*.nflxvideo.net</span>,{" "}
            <span style={styles.code}>*.nflxso.net</span>) with credentials
            omitted, which means no cookies or account information are sent with
            those requests. Downloaded subtitles are held in memory only, at
            most 24 at a time, and are never uploaded to us.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. How we use your information</h2>
          <p style={styles.paragraph}>
            We use the information described above only to provide the features
            of the service: to sign you in, to store and display the vocabulary
            you save, and to look up meanings and readings you ask for.
          </p>
          <p style={styles.paragraph}>
            We do not sell your data. We do not share it with third parties for
            advertising or any unrelated purpose. We do not use it to train
            machine learning models. The only server your data is sent to is our
            own backend (
            <span style={styles.code}>voca-app-backend.foopky.com</span>),
            except where disclosure is required by law.
          </p>
          <p style={styles.paragraph}>
            Our servers and database run on Amazon Web Services in the Asia
            Pacific (Seoul) region (ap-northeast-2), in South Korea. If you use
            Japflix from another country, your account and saved vocabulary are
            stored there.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Retention and deletion</h2>
          <p style={styles.paragraph}>
            We keep your account and the vocabulary you saved for as long as
            your account exists. We do not keep it after that.
          </p>
          <p style={styles.paragraph}>
            You can delete individual words from your vocabulary at any time in
            Japflix Voca. When you close your account, your account record and
            all vocabulary saved with it are deleted immediately and
            automatically — you do not need to contact us, and we do not keep a
            copy.
          </p>
          <p style={styles.paragraph}>
            Everything the extension stores on your device is cleared when you
            sign out, which deletes your stored session, or when you remove the
            extension from Chrome.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Security</h2>
          <p style={styles.paragraph}>
            All communication with our server uses HTTPS. Your session is held
            as a short-lived access token together with a refresh token that is
            rotated on each use, so that a captured token has a limited
            lifetime. Passwords are never stored by the extension.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Children</h2>
          <p style={styles.paragraph}>
            Japflix is not directed at children under 13, and we do not
            knowingly collect personal information from them.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Changes to this policy</h2>
          <p style={styles.paragraph}>
            If we change how we handle your data, we will update this page and
            change the date at the top. If a change is significant — for
            example, if a new feature sends data to a service we do not operate
            — we will say so here before the feature is released.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Contact</h2>
          <p style={styles.paragraph}>
            Questions about this policy or requests regarding your data:{" "}
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

        <div style={styles.lastUpdated}>Last updated: August 2, 2026</div>
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
    marginBottom: 24,
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
    fontSize: 14,
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  },
  intro: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#475569",
    margin: "0 0 14px",
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
    margin: "0 0 14px",
  },
  lead: {
    color: "#0f172a",
    fontWeight: 700,
  },
  list: {
    margin: 0,
    paddingLeft: 22,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#475569",
    marginBottom: 8,
  },
  code: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 13.5,
    color: "#0f172a",
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    padding: "1px 5px",
    wordBreak: "break-all",
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
