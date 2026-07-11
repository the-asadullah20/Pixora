import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { ChatShell } from "@/components/chat/ChatShell";

export default function AppPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-sky-wash">
        <Navbar />
        <ChatShell />
      </div>
    </ProtectedRoute>
  );
}
