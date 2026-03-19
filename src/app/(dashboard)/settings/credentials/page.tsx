"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { KeyRound } from "lucide-react";

export default function CredentialsSettingsPage() {
  return (
    <>
      <PageHeader title="Credentials" description="Manage admin credentials" />
      <SettingsForm
        settingsKey="credentials"
        title="Credentials"
        icon={<KeyRound className="h-5 w-5" />}
        fields={[
          { name: "username", label: "Username", type: "text" },
          { name: "password", label: "Password", type: "password" },
        ]}
      />
    </>
  );
}
