"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Type } from "lucide-react";

export default function LoginTextSettingsPage() {
  return (
    <>
      <PageHeader title="Login Text" description="Customize login screen text" />
      <SettingsForm
        settingsKey="login-text"
        title="Login Text"
        icon={<Type className="h-5 w-5" />}
        fields={[
          { name: "loginTitle", label: "Login Title", type: "text" },
          { name: "loginSubtitle", label: "Login Subtitle", type: "text" },
        ]}
      />
    </>
  );
}
