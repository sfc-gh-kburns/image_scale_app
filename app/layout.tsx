import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Scale Studio",
  description: "Scale product images for retail partners",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container header-inner">
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="12" fill="#DF0714" />
              <path d="M16 20h32v24H16z" stroke="#fff" strokeWidth="2" fill="none" />
              <path d="M22 26h20v12H22z" stroke="#FFB5CD" strokeWidth="2" strokeDasharray="4 2" fill="none" />
            </svg>
            <h1>Image <span>Scale</span> Studio</h1>
          </div>
        </header>
        <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
