import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// Auth context and guards
import AuthProvider from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import AdminRoute from "@/auth/AdminRoute";
import ProfileSettings from "@/pages/ProfileSettings";
import { useAuth } from "@/auth/AuthContext";
// Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import UserDashboard from "@/pages/UserDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Books from "@/pages/Books";
import BookDetails from "@/pages/BookDetails";
import MyLoans from "@/pages/MyLoans";

function RoleRedirect() {
  const { user } = useAuth(); // e.g. { role: "admin" | "member" }

  if (!user) return <Navigate to="/login" replace />;
  return user.role === "admin"
    ? <Navigate to="/admin" replace />
    : <Navigate to="/dashboard" replace />;
}


ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User dashboard - protected for all logged in users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books"
          element={
            <ProtectedRoute>
              <Books />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books/:id"
          element={
            <ProtectedRoute>
              <BookDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <MyLoans />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard - only admins */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
