import { AppBar } from "./AppBar";
import { ModeratorAlert } from "./ModeratorAlert";
import { useAuth } from "@/contexts/AuthContext";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isModerator } = useAuth();

  return (
    <>
      <AppBar />
      {isModerator && <ModeratorAlert />}
      <main className="pt-24">
        {children}
      </main>
    </>
  );
};
