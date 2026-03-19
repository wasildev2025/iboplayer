"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSettings } from "@/hooks/use-settings";
import type { SettingsKey } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export interface SettingsField {
  name: string;
  label: string;
  type?: "text" | "number" | "color" | "password" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface SettingsFormProps {
  settingsKey: SettingsKey;
  title: string;
  icon?: React.ReactNode;
  fields: SettingsField[];
  description?: string;
}

export function SettingsForm({
  settingsKey,
  title,
  icon,
  fields,
  description,
}: SettingsFormProps) {
  const { data, isLoading, save } = useSettings<Record<string, unknown>>(settingsKey);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    if (data) {
      const values: Record<string, unknown> = {};
      fields.forEach((f) => {
        values[f.name] = (data as Record<string, unknown>)[f.name] ?? "";
      });
      reset(values);
    }
  }, [data, fields, reset]);

  const onSubmit = async (formData: Record<string, unknown>) => {
    try {
      await save.mutateAsync(formData);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "select" && field.options ? (
                  <select
                    id={field.name}
                    {...register(field.name)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "color" ? (
                  <Input
                    id={field.name}
                    type="color"
                    {...register(field.name)}
                    className="h-10 w-20 p-1 cursor-pointer"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    {...register(field.name, {
                      valueAsNumber: field.type === "number",
                    })}
                  />
                )}
              </div>
            ))}
            <Button type="submit" disabled={save.isPending || !isDirty} className="w-full">
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
