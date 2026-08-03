// app/layout.tsx
import type { Viewport } from "next";
import Footer from "./component/footer";
import "./globals.css";

export const metadata = {
  title: "Japflix Voca",
};

// without this a phone lays the page out at ~980px wide and scales it down
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* the flex column that keeps the footer down is in globals.css */}
      <body>
        {/* min-width lets a wide child shrink instead of stretching the page */}
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}
