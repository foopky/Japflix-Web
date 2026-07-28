// app/layout.tsx
import Footer from "./component/footer";
import "./globals.css";

export const metadata = {
  title: "Japflix Voca",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html style={{ height: "100%" }}>
      <body
        style={{
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}
