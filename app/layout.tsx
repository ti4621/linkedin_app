import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "LinkedIn Games Time Tracker",
  description: "Track daily Zip, Mini Sudoku, and Queens times."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <nav className="nav container">
            <Link className="chip" href="/today">
              Today Entry
            </Link>
            <Link className="chip" href="/history">
              History
            </Link>
            <Link className="chip" href="/stats">
              Statistics
            </Link>
            <Link className="chip" href="/scoreboard">
              Scoreboard
            </Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
