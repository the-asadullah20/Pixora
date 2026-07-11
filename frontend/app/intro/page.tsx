import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { BubbleIntro } from "@/components/intro/BubbleIntro";

export default function IntroPage() {
  return (
    <ProtectedRoute>
      <BubbleIntro />
    </ProtectedRoute>
  );
}
