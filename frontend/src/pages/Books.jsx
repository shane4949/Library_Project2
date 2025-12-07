import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import api from "@/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { socket } from "@/realtime/socket"; 



export default function Books() {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  // Initial data load
  (async () => {
    const { data } = await api.get("/books");
    setBooks(data);
  })();

  // 🔊 Listen for server events
  const onCreated = (book) => setBooks(prev => [book, ...prev]);
  const onUpdated = (book) => setBooks(prev => prev.map(b => b._id === book._id ? book : b));
  const onDeleted = ({ bookId }) => setBooks(prev => prev.filter(b => b._id !== bookId));
  const onAvailability = ({ bookId, copiesAvailable }) =>
    setBooks(prev => prev.map(b => b._id === bookId ? { ...b, copiesAvailable } : b));

  socket.on("book:created", onCreated);
  socket.on("book:updated", onUpdated);
  socket.on("book:deleted", onDeleted);
  socket.on("book:availability", onAvailability);

  return () => {
    socket.off("book:created", onCreated);
    socket.off("book:updated", onUpdated);
    socket.off("book:deleted", onDeleted);
    socket.off("book:availability", onAvailability);
  };
}, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/books");
        setBooks(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return books.filter(b => (`${b.title} ${b.author} ${b.isbn}`).toLowerCase().includes(s));
  }, [books, q]);

  const borrow = async (bookId) => {
    try {
      await api.post("/loans/borrow", { bookId });
      // optimistic UI: reduce available by 1
      setBooks(prev => prev.map(b => b._id === bookId ? { ...b, copiesAvailable: b.copiesAvailable - 1 } : b));
      alert("Borrowed!");
    } catch (e) {
      alert(e.response?.data?.message || "Borrow failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Books</h2>

        <div className="flex items-center justify-between mb-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/author/isbn…" className="w-80" />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">Loading…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(b => (
                    <TableRow key={b._id}>
                      <TableCell
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(`/books/${b._id}`)}
                      >
                        {b.title}
                      </TableCell>
                      <TableCell>{b.author}</TableCell>
                      <TableCell>{b.isbn}</TableCell>
                      <TableCell>{b.copiesAvailable}/{b.copiesTotal}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => borrow(b._id)}
                          disabled={b.copiesAvailable <= 0}
                        >
                          {b.copiesAvailable > 0 ? "Borrow" : "Unavailable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={5}>No books found.</TableCell></TableRow>
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
