import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { HistoryList } from "@/components/history/HistoryList";

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-sky-wash">
        <Navbar />
        <HistoryList />
      </div>
    </ProtectedRoute>
  );
}
