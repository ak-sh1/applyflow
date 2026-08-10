import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ApplyFlow — Application Tracker",
  description: "Track applications, interviews, offers and next steps in one focused workspace.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer className="creator-credit" aria-label="Creator credit">
          <span>Built by</span>
          <a
            href="https://github.com/ak-sh1"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit Akash's GitHub profile"
          >
            Akash ↗
          </a>
        </footer>
      </body>
    </html>
  );
}
