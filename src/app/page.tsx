import { ResultsBoard } from "@/components/ResultsBoard";

export default function Home() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">בחירות לכנסת ה-26</p>
        <h1>חישוב מנדטים חי</h1>
        <p className="lede">
          עדכון אוטומטי מתוצאות הוועדה המרכזית, עם אחוז חסימה 3.25% מקולות עד
          עתה וחלוקת 120 מנדטים בשיטת השארית הגדולה.
        </p>
      </header>
      <ResultsBoard />
    </main>
  );
}
