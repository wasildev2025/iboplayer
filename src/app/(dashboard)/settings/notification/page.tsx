"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Bell } from "lucide-react";

export default function NotificationSettingsPage() {
  return (
    <>
      <PageHeader title="Notification Settings" description="Configure notification messages" />
      <SettingsForm
        settingsKey="notification"
        title="Notification Settings"
        icon={<Bell className="h-5 w-5" />}
        fields={[
          { name: "messageOne", label: "Message One", type: "text" },
          { name: "messageTwo", label: "Message Two", type: "text" },
        ]}
      />
    </>
  );
}
