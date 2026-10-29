import type { Metadata } from "next";
import { Heebo, Rubik } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "מנדט · חישוב מנדטים מתוצאות האמת",
  description:
    "מושך את תוצאות ועדת הבחירות, מחשב אחוז חסימה מתוך קולות עד עתה ומחלק מנדטים.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${rubik.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
