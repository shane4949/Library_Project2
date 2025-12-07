import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { socket } from "@/realtime/socket";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, profile, logout } = useAuth();

  const [online, setOnline] = useState(0);

  useEffect(() => {
    const handlePresence = ({ online: count }) => setOnline(count);
    socket.on("presence", handlePresence);
    return () => socket.off("presence", handlePresence);
  }, []);

  const nameOrEmail = profile?.name || profile?.email || "User";
  const roleLabel = isAdmin ? "admin" : "member";

  return (
    <header className="w-full bg-white shadow-sm py-3 px-6 flex items-center justify-between">
      <h1
        className="text-xl font-bold text-blue-600 cursor-pointer"
        onClick={() => navigate("/")}
      >
        Library System
      </h1>

      {!isAuthenticated ? (
        <div className="space-x-3">
          <Button variant="outline" onClick={() => navigate("/login")}>
            Login
          </Button>
          <Button onClick={() => navigate("/register")}>Register</Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Hello, <span className="font-semibold">{nameOrEmail}</span> ({roleLabel})
          </span>
          <span className="text-xs text-gray-500 ml-2">Online: {online}</span>
          <Button variant="outline" onClick={() => navigate("/books")}>Books</Button>
          <Button variant="outline" onClick={() => navigate("/loans")}>My Loans</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>User Dashboard</Button>
          {isAdmin && <Button onClick={() => navigate("/admin")}>Admin</Button>}
          <Button variant="destructive" onClick={logout}>Logout</Button>
        </div>
      )}
    </header>
  );
}
