import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import api from "@/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await api.get("/loans/my");
    setLoans(data);
  };

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = useMemo(() => loans.filter(l => !l.returnedDate), [loans]);
  const history = useMemo(() => loans.filter(l => l.returnedDate), [loans]);

  const returnLoan = async (loan) => {
    try {
      await api.put(`/loans/${loan._id}/return`);
      await refresh();
    } catch (e) {
      alert(e.response?.data?.message || "Return failed");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString() : "—";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-semibold">My Loans</h2>

        <Card>
          <CardContent className="p-0">
            <h3 className="text-lg font-semibold px-4 pt-4">Active</h3>
            {loading ? <div className="p-4">Loading…</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Loaned</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map(l => (
                    <TableRow key={l._id}>
                      <TableCell>{l.bookId?.title || l.bookTitle || l.bookId}</TableCell>
                      <TableCell>{fmt(l.loanDate)}</TableCell>
                      <TableCell>{fmt(l.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" onClick={() => returnLoan(l)}>Return</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {active.length === 0 && (
                    <TableRow><TableCell colSpan={4}>No active loans.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <h3 className="text-lg font-semibold px-4 pt-4">History</h3>
            {loading ? <div className="p-4">Loading…</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Loaned</TableHead>
                    <TableHead>Returned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(l => (
                    <TableRow key={l._id}>
                      <TableCell>{l.bookId?.title || l.bookTitle || l.bookId}</TableCell>
                      <TableCell>{fmt(l.loanDate)}</TableCell>
                      <TableCell>{fmt(l.returnedDate)}</TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow><TableCell colSpan={3}>No history.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
