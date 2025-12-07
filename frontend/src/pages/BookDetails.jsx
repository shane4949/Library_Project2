import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { socket } from "@/realtime/socket";

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [myLoans, setMyLoans] = useState([]);

  // Load book + my loans
  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/books/${id}`);
      setBook(data);
    })();
    (async () => {
      const { data } = await api.get("/loans/my");
      setMyLoans(data);
    })();
  }, [id]);

  // 🔊 Live availability updates for THIS book
  useEffect(() => {
    const onAvailability = ({ bookId, copiesAvailable }) => {
      if (bookId === id) {
        setBook(prev => (prev ? { ...prev, copiesAvailable } : prev));
      }
    };
    socket.on("book:availability", onAvailability);
    return () => socket.off("book:availability", onAvailability);
  }, [id]);

  // Optional: react to admin edits (title/author/etc) of this book
  useEffect(() => {
    const onUpdated = (updated) => {
      if (updated._id === id) setBook(updated);
    };
    socket.on("book:updated", onUpdated);
    return () => socket.off("book:updated", onUpdated);
  }, [id]);

  const activeLoan = myLoans.find(
    l => (!l.returnedDate) && (l.bookId === id || l.bookId?._id === id)
  );

  const borrow = async () => {
    try {
      await api.post("/loans/borrow", { bookId: id });
      // optimistic local update; socket will also update everyone else
      setBook(prev => ({ ...prev, copiesAvailable: prev.copiesAvailable - 1 }));
      const { data } = await api.get("/loans/my");
      setMyLoans(data);
      alert("Borrowed!");
    } catch (e) {
      alert(e.response?.data?.message || "Borrow failed");
    }
  };

  const doReturn = async () => {
    try {
      await api.put(`/loans/${activeLoan._id}/return`);
      setBook(prev => ({ ...prev, copiesAvailable: prev.copiesAvailable + 1 }));
      const { data } = await api.get("/loans/my");
      setMyLoans(data);
      alert("Returned!");
    } catch (e) {
      alert(e.response?.data?.message || "Return failed");
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <h2 className="text-2xl font-semibold">{book.title}</h2>
        <Card>
          <CardContent className="p-6 space-y-2">
            <p><b>Author:</b> {book.author}</p>
            <p><b>ISBN:</b> {book.isbn}</p>
            <p><b>Available:</b> {book.copiesAvailable}/{book.copiesTotal}</p>
            {book.description && <p className="text-gray-700">{book.description}</p>}

            {!activeLoan ? (
              <Button onClick={borrow} disabled={book.copiesAvailable <= 0}>
                {book.copiesAvailable > 0 ? "Borrow" : "Unavailable"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={doReturn}>
                Return Book
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
