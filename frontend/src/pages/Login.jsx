import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(role === "admin" ? "/admin" : "/dashboard", {
        replace: true,
      });
    }
  }, [isAuthenticated, role, navigate]);

  const onSubmit = async (data) => {
    try {
      const userRole = await login(data);
      navigate(userRole === "admin" ? "/admin" : "/dashboard", {
        replace: true,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Login failed.");
    }
  };

  // Optional: prevent form flash before redirect
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="flex items-center justify-center h-[80vh]">
        <Card className="p-6 w-full max-w-md shadow-md">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>

            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...register("email", {
                        required: "Email is required",
                      })}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">
                        {errors.email.message}
                      </p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel>Password</FieldLabel>
                    <Input
                      type="password"
                      placeholder="********"
                      {...register("password", {
                        required: "Password is required",
                      })}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm">
                        {errors.password.message}
                      </p>
                    )}
                  </Field>
                </FieldGroup>
              </FieldSet>

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
