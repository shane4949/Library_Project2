import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import api from "@/api";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { socket } from "@/realtime/socket";



export default function AdminDashboard() {
  const [tab, setTab] = useState("users");

  // ===== USERS =====
  const [users, setUsers] = useState([]);
  const [uQuery, setUQuery] = useState("");
  const [uLoading, setULoading] = useState(true);

  const [uAddOpen, setUAddOpen] = useState(false);
  const [uEditOpen, setUEditOpen] = useState(false);
  const [uResetOpen, setUResetOpen] = useState(false);

  const [targetUser, setTargetUser] = useState(null);
  const [uForm, setUForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [uNewPassword, setUNewPassword] = useState("");

  // ===== BOOKS =====
  const [books, setBooks] = useState([]);
  const [bQuery, setBQuery] = useState("");
  const [bLoading, setBLoading] = useState(true);

  const [bAddOpen, setBAddOpen] = useState(false);
  const [bEditOpen, setBEditOpen] = useState(false);
  const [targetBook, setTargetBook] = useState(null);
  const [bForm, setBForm] = useState({
    title: "",
    author: "",
    isbn: "",
    categories: "",
    copiesTotal: 1,
    copiesAvailable: 1,
    description: "",
    coverImageUrl: "",
  });

  useEffect(() => {
  const onCreated = (book) => setBooks(prev => [book, ...prev]);
  const onUpdated = (book) => setBooks(prev => prev.map(b => b._id === book._id ? book : b));
  const onDeleted = ({ bookId }) => setBooks(prev => prev.filter(b => b._id !== bookId));
  const onAvailability = ({ bookId, copiesAvailable }) => {
    setBooks(prev => prev.map(b => b._id === bookId ? { ...b, copiesAvailable } : b));
  };
  socket.on("book:created", onCreated);
  socket.on("book:updated", onUpdated);
  socket.on("book:deleted", onDeleted);
  socket.on("book:availability", onAvailability);
  return () => {
    socket.off("book:created", onCreated);
    socket.off("book:updated", onUpdated);
    socket.off("book:deleted", onDeleted);
    return () => socket.off("book:availability", onAvailability);
  };
}, []);

  // ===== helpers =====
  const fmtDate = (d) => new Date(d).toLocaleDateString();

  // ===== load data =====
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/users");
        setUsers(data);
      } finally {
        setULoading(false);
      }
    })();
    (async () => {
      try {
        const { data } = await api.get("/admin/books");
        setBooks(data);
      } finally {
        setBLoading(false);
      }
    })();
  }, []);

  // ===== filters =====
  const filteredUsers = useMemo(() => {
    const q = uQuery.toLowerCase();
    return users.filter((u) => (`${u.name ?? ""} ${u.email ?? ""} ${u.role ?? ""}`).toLowerCase().includes(q));
  }, [users, uQuery]);

  const filteredBooks = useMemo(() => {
    const q = bQuery.toLowerCase();
    return books.filter((b) => (
      `${b.title ?? ""} ${b.author ?? ""} ${b.isbn ?? ""}`.toLowerCase().includes(q)
    ));
  }, [books, bQuery]);

  // ===== USERS: actions =====
  const openAddUser = () => {
    setUForm({ name: "", email: "", password: "", role: "member" });
    setUAddOpen(true);
  };
  const openEditUser = (u) => {
    setTargetUser(u);
    setUForm({ name: u.name ?? "", email: u.email ?? "", password: "", role: u.role ?? "member" });
    setUEditOpen(true);
  };
  const openResetPass = (u) => {
    setTargetUser(u);
    setUNewPassword("");
    setUResetOpen(true);
  };

  const addUser = async () => {
    try {
      const { data } = await api.post("/admin/users", uForm);
      setUsers((prev) => [data, ...prev]);
      setUAddOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || "Create user failed");
    }
  };

  const saveUser = async () => {
    try {
      const { data } = await api.put(`/admin/users/${targetUser._id}`, {
        name: uForm.name, email: uForm.email, role: uForm.role,
      });
      setUsers((prev) => prev.map((u) => (u._id === targetUser._id ? data : u)));
      setUEditOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || "Update user failed");
    }
  };

  const promoteUser = async (u) => {
    try {
      await api.post(`/admin/users/${u._id}/promote`);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: "admin" } : x)));
    } catch (e) {
      alert(e.response?.data?.message || "Promote failed");
    }
  };

  const resetPassword = async () => {
    try {
      await api.put(`/admin/users/${targetUser._id}/password`, { newPassword: uNewPassword });
      setUResetOpen(false);
      alert(`Password reset for ${targetUser.email}`);
    } catch (e) {
      alert(e.response?.data?.message || "Reset password failed");
    }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete user ${u.email}?`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  // ===== BOOKS: actions =====
  const openAddBook = () => {
    setBForm({
      title: "", author: "", isbn: "", categories: "",
      copiesTotal: 1, copiesAvailable: 1, description: "", coverImageUrl: "",
    });
    setBAddOpen(true);
  };
  const openEditBook = (b) => {
    setTargetBook(b);
    setBForm({
      title: b.title ?? "", author: b.author ?? "", isbn: b.isbn ?? "",
      categories: (b.categories || []).join(", "),
      copiesTotal: b.copiesTotal ?? 1, copiesAvailable: b.copiesAvailable ?? 1,
      description: b.description ?? "", coverImageUrl: b.coverImageUrl ?? "",
    });
    setBEditOpen(true);
  };

  const addBook = async () => {
    try {
      const payload = {
        ...bForm,
        categories: bForm.categories
          ? bForm.categories.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await api.post("/admin/books", payload);
      setBAddOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || "Create book failed");
    }
  };

  const saveBook = async () => {
    try {
      const payload = {
        ...bForm,
        categories: bForm.categories
          ? bForm.categories.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const { data } = await api.put(`/admin/books/${targetBook._id}`, payload);
      setBooks((prev) => prev.map((b) => (b._id === targetBook._id ? data : b)));
      setBEditOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || "Update book failed");
    }
  };

  const deleteBook = async (b) => {
    if (!confirm(`Delete book "${b.title}"?`)) return;
    try {
      await api.delete(`/admin/books/${b._id}`);
      setBooks((prev) => prev.filter((x) => x._id !== b._id));
    } catch (e) {
      alert(e.response?.data?.message || "Delete book failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>

        <Card className="p-4">
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="books">Books</TabsTrigger>
              </TabsList>

              {/* ===== USERS TAB ===== */}
              <TabsContent value="users" className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    className="w-72"
                    placeholder="Search users…"
                    value={uQuery}
                    onChange={(e) => setUQuery(e.target.value)}
                  />
                  <Button onClick={openAddUser}>Add User</Button>
                </div>

                {uLoading ? (
                  <p>Loading users…</p>
                ) : (
                  <div className="rounded-md border bg-card text-card-foreground">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u._id}>
                            <TableCell>{u.name || "—"}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell className="capitalize">{u.role}</TableCell>
                            <TableCell>{fmtDate(u.createdAt)}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" onClick={() => openEditUser(u)}>Edit</Button>
                              {u.role !== "admin" && (
                                <Button variant="secondary" onClick={() => promoteUser(u)}>Promote</Button>
                              )}
                              <Button variant="secondary" onClick={() => openResetPass(u)}>Reset PW</Button>
                              <Button variant="destructive" onClick={() => deleteUser(u)}>Delete</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow><TableCell colSpan={5}>No users found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ===== BOOKS TAB ===== */}
              <TabsContent value="books" className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    className="w-72"
                    placeholder="Search books…"
                    value={bQuery}
                    onChange={(e) => setBQuery(e.target.value)}
                  />
                  <Button onClick={openAddBook}>Add Book</Button>
                </div>

                {bLoading ? (
                  <p>Loading books…</p>
                ) : (
                  <div className="rounded-md border bg-card text-card-foreground">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>ISBN</TableHead>
                          <TableHead>Copies</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBooks.map((b) => (
                          <TableRow key={b._id}>
                            <TableCell className="font-medium">{b.title}</TableCell>
                            <TableCell>{b.author}</TableCell>
                            <TableCell>{b.isbn}</TableCell>
                            <TableCell>{b.copiesAvailable}/{b.copiesTotal}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" onClick={() => openEditBook(b)}>Edit</Button>
                              <Button variant="destructive" onClick={() => deleteBook(b)}>Delete</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredBooks.length === 0 && (
                          <TableRow><TableCell colSpan={5}>No books found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Add User */}
      <Dialog open={uAddOpen} onOpenChange={setUAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={uForm.name} onChange={(e) => setUForm({ ...uForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={uForm.role} onValueChange={(v) => setUForm({ ...uForm, role: v })}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">member</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUAddOpen(false)}>Cancel</Button>
            <Button onClick={addUser} disabled={!uForm.email || !uForm.password || !uForm.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User */}
      <Dialog open={uEditOpen} onOpenChange={setUEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={uForm.name} onChange={(e) => setUForm({ ...uForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={uForm.role} onValueChange={(v) => setUForm({ ...uForm, role: v })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">member</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUEditOpen(false)}>Cancel</Button>
            <Button onClick={saveUser}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={uResetOpen} onOpenChange={setUResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>User</Label><div className="text-sm text-muted-foreground">{targetUser?.name} ({targetUser?.email})</div></div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" value={uNewPassword} onChange={(e) => setUNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUResetOpen(false)}>Cancel</Button>
            <Button onClick={resetPassword} disabled={!uNewPassword}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Book */}
      <Dialog open={bAddOpen} onOpenChange={setBAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
          <BookForm bForm={bForm} setBForm={setBForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBAddOpen(false)}>Cancel</Button>
            <Button onClick={addBook} disabled={!bForm.title || !bForm.author || !bForm.isbn}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Book */}
      <Dialog open={bEditOpen} onOpenChange={setBEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Book</DialogTitle></DialogHeader>
          <BookForm bForm={bForm} setBForm={setBForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBEditOpen(false)}>Cancel</Button>
            <Button onClick={saveBook}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Small shared form for books ---------- */
function BookForm({ bForm, setBForm }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={bForm.title} onChange={(e) => setBForm({ ...bForm, title: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Author</Label>
        <Input value={bForm.author} onChange={(e) => setBForm({ ...bForm, author: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>ISBN</Label>
        <Input value={bForm.isbn} onChange={(e) => setBForm({ ...bForm, isbn: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Categories (comma separated)</Label>
        <Input value={bForm.categories} onChange={(e) => setBForm({ ...bForm, categories: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Total Copies</Label>
        <Input type="number" min={0} value={bForm.copiesTotal}
               onChange={(e) => setBForm({ ...bForm, copiesTotal: Number(e.target.value) })} />
      </div>
      <div className="space-y-1">
        <Label>Available Copies</Label>
        <Input type="number" min={0} value={bForm.copiesAvailable}
               onChange={(e) => setBForm({ ...bForm, copiesAvailable: Number(e.target.value) })} />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label>Description</Label>
        <Textarea rows={4} value={bForm.description}
                  onChange={(e) => setBForm({ ...bForm, description: e.target.value })} />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label>Cover Image URL</Label>
        <Input value={bForm.coverImageUrl}
               onChange={(e) => setBForm({ ...bForm, coverImageUrl: e.target.value })} />
      </div>
    </div>
  );
}
