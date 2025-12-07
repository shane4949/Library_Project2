import { useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "@/api";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldSet, FieldDescription } from "@/components/ui/field";

export default function ProfileSettings() {
  const { profile } = useAuth();

  // -------- Profile form (name/email) --------
  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    formState: { isSubmitting: savingProfile },
  } = useForm();

  useEffect(() => {
    // Load current profile from API (authoritative)
    (async () => {
      const { data } = await api.get("/users/me");
      resetProfile({ name: data.name || "", email: data.email || "" });
    })();
  }, [resetProfile]);

  const onSaveProfile = async (values) => {
    await api.put("/users/me", values);
    alert("Profile updated");
  };

  // -------- Password form --------
  const {
    register: regPass,
    handleSubmit: submitPass,
    reset: resetPass,
    watch,
    formState: { isSubmitting: savingPass },
  } = useForm();

  const onSavePassword = async ({ oldPassword, newPassword, confirm }) => {
    if (newPassword !== confirm) {
      alert("New passwords do not match");
      return;
    }
    await api.put("/users/me/password", { oldPassword, newPassword });
    resetPass();
    alert("Password changed");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <h2 className="text-2xl font-semibold">Profile Settings</h2>

        {/* Profile (name/email) */}
        <Card className="p-6 shadow-md">
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Your Details</h3>
            <form onSubmit={submitProfile(onSaveProfile)}>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input type="text" placeholder="Your name" {...regProfile("name", { required: true })} />
                  </Field>
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input type="email" placeholder="you@example.com" {...regProfile("email", { required: true })} />
                  </Field>
                </FieldGroup>
              </FieldSet>
              <Button type="submit" className="mt-4" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card className="p-6 shadow-md">
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <form onSubmit={submitPass(onSavePassword)}>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Current Password</FieldLabel>
                    <Input type="password" placeholder="********" {...regPass("oldPassword", { required: true })} />
                  </Field>
                  <Field>
                    <FieldLabel>New Password</FieldLabel>
                    <FieldDescription>At least 6 characters.</FieldDescription>
                    <Input type="password" placeholder="********" {...regPass("newPassword", { required: true, minLength: 6 })} />
                  </Field>
                  <Field>
                    <FieldLabel>Confirm New Password</FieldLabel>
                    <Input type="password" placeholder="********" {...regPass("confirm", { required: true })} />
                  </Field>
                </FieldGroup>
              </FieldSet>
              <Button type="submit" className="mt-4" disabled={savingPass}>
                {savingPass ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
