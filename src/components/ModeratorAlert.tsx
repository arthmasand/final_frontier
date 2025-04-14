import { Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

export const ModeratorAlert = () => {
  const { isModerator, moderatorTimeSlot } = useAuth();

  if (!isModerator) return null;

  return (
    <Alert className="fixed top-16 left-0 right-0 z-40">
      <AlertDescription className="container flex items-center gap-2 py-2">
        <Clock className="h-4 w-4" />
        You are a moderator for the {moderatorTimeSlot} time slot
      </AlertDescription>
    </Alert>
  );
};
