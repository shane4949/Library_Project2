import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/users/me");
      setUser(data);
      const { data: myLoans } = await api.get("/loans/my");
      setLoans(myLoans);
    })();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">Loading…</div>
      </div>
    );
  }

  const active = loans.filter(l => !l.returnedDate);
  const returned = loans.filter(l => l.returnedDate);

  const fmt = d => new Date(d).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-semibold mb-2">Welcome back, {user.name || user.email} 👋</h2>
        <p className="text-gray-600">Role: {user.role}</p>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-gray-500">Active Loans</p><h3 className="text-2xl font-bold">{active.length}</h3></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-gray-500">Total Borrowed</p><h3 className="text-2xl font-bold">{loans.length}</h3></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-gray-500">Joined</p><h3 className="text-2xl font-bold">{fmt(user.createdAt)}</h3></CardContent></Card>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/books")}>Browse Books</Button>
          <Button onClick={() => navigate("/loans")}>My Loans</Button>
          <Button onClick={() => navigate("/profile")}>Edit Profile</Button>
        </div>

        {/* Active loans preview */}
        <div>
          <h3 className="text-xl font-semibold mt-6 mb-2">Your Active Loans</h3>
          {active.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Loan Date</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.slice(0, 5).map(l => (
                  <TableRow key={l._id}>
                    <TableCell>{l.bookId?.title || "Unknown"}</TableCell>
                    <TableCell>{fmt(l.loanDate)}</TableCell>
                    <TableCell>{fmt(l.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">You have no active loans.</p>
          )}
        </div>

        {/* Recent history */}
        <div>
          <h3 className="text-xl font-semibold mt-6 mb-2">Recent Activity</h3>
          {returned.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {returned.slice(0, 5).map(l => (
                <li key={l._id}>Returned <b>{l.bookId?.title || "a book"}</b> on {fmt(l.returnedDate)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
