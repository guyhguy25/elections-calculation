import { ResultsBoard } from "@/components/ResultsBoard";

export default function Home() {
  return (
    <main className="page-shell">
      <ResultsBoard />
      <footer className="page-footer">
        מקור הנתונים: ועדת הבחירות המרכזית. התוצאות חלקיות עד לפרסום
        ברשומות. זה כלי מקומי לחישוב לפי הנוסחה שבחרת — לא פרסום רשמי של
        מנדטים.
      </footer>
    </main>
  );
}
