"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Film } from "lucide-react";

export default function TmdbSettingsPage() {
  return (
    <>
      <PageHeader title="TMDB Settings" description="Configure TMDB API integration" />
      <SettingsForm
        settingsKey="tmdb"
        title="TMDB Settings"
        icon={<Film className="h-5 w-5" />}
        fields={[
          { name: "tmdbKey", label: "TMDB API Key", type: "text", placeholder: "Enter your TMDB API key" },
        ]}
      />
    </>
  );
}
