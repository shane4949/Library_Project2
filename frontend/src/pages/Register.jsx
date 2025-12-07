import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import {
  Field, FieldGroup, FieldLabel, FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post("/auth/register", data);
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex items-center justify-center h-[80vh]">
        <Card className="p-6 w-full max-w-md shadow-md">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                  </Field>
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...register("email", { required: "Email is required" })}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                  </Field>
                  <Field>
                    <FieldLabel>Password</FieldLabel>
                    <Input
                      type="password"
                      placeholder="********"
                      {...register("password", {
                        required: "Password is required",
                        minLength: { value: 6, message: "At least 6 characters" },
                      })}
                    />
                    {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                  </Field>
                </FieldGroup>
              </FieldSet>

              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
