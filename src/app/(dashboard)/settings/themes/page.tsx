"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { PageHeader } from "@/components/shared/page-header";
import { THEME_OPTIONS, type ThemeOption } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Check,
  Smartphone,
  Loader2,
  Sparkles,
  Monitor,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ThemeSettingsPage() {
  const { data, isLoading, save } = useSettings<{ themeNo: string }>("themes");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "standard" | "manual" | "frame">("all");

  useEffect(() => {
    if (data?.themeNo) {
      setSelectedTheme(data.themeNo);
    }
  }, [data]);

  const handleApplyTheme = async (themeValue: string) => {
    try {
      await save.mutateAsync({ themeNo: themeValue });
      setSelectedTheme(themeValue);
      const theme = THEME_OPTIONS.find((t) => t.value === themeValue);
      toast.success(`${theme?.label} applied`, {
        description:
          "Theme will be pushed to Android app on next sync.",
      });
    } catch {
      toast.error("Failed to apply theme");
    }
  };

  const filteredThemes = THEME_OPTIONS.filter((t) => {
    if (filter === "all") return true;
    if (filter === "standard") return !t.tag;
    if (filter === "manual") return t.tag === "Manual Ads Only";
    if (filter === "frame") return t.tag === "Frame Ads Only";
    return true;
  });

  const activeTheme = THEME_OPTIONS.find((t) => t.value === selectedTheme);
  const hoveredTheme = previewTheme
    ? THEME_OPTIONS.find((t) => t.value === previewTheme)
    : null;
  const displayTheme = hoveredTheme || activeTheme;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="App Themes"
        description="Choose a theme for your Android application. Changes are pushed to devices on next sync."
      />

      {/* Active Theme Banner */}
      <Card className="mb-6 border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/20">
            <Smartphone className="h-6 w-6 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              Currently Active on Android App
            </p>
            <p className="text-lg font-semibold text-foreground">
              {activeTheme?.label || "No theme selected"}
              {activeTheme?.tag && (
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2 text-xs",
                    activeTheme.tagColor === "orange"
                      ? "border-orange-500/50 text-orange-400"
                      : activeTheme.tagColor === "blue"
                        ? "border-blue-500/50 text-blue-400"
                        : "border-green-500/50 text-green-400"
                  )}
                >
                  {activeTheme.tag}
                </Badge>
              )}
            </p>
          </div>
          {activeTheme && (
            <div className="hidden md:block shrink-0 w-48 h-28 rounded-lg overflow-hidden border border-border">
              <img
                src={`/themes/${activeTheme.value}.jpg`}
                alt={activeTheme.label}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Panel — shows on hover */}
      {displayTheme && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Preview Image */}
              <div className="md:w-1/2">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black">
                  <img
                    src={`/themes/${displayTheme.value}.jpg`}
                    alt={displayTheme.label}
                    className="w-full h-full object-contain"
                  />
                  {hoveredTheme && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/60 text-white backdrop-blur-sm border-0">
                        <Monitor className="h-3 w-3 mr-1" />
                        Preview
                      </Badge>
                    </div>
                  )}
                  {!hoveredTheme && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500/80 text-white border-0">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Details */}
              <div className="md:w-1/2 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">{displayTheme.label}</h3>
                  {displayTheme.tag && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        displayTheme.tagColor === "orange"
                          ? "bg-orange-500/20 text-orange-400"
                          : displayTheme.tagColor === "blue"
                            ? "bg-blue-500/20 text-blue-400"
                            : ""
                      )}
                    >
                      {displayTheme.tag}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">
                  {displayTheme.description}
                </p>

                {displayTheme.tag && (
                  <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {displayTheme.tag === "Manual Ads Only"
                        ? "This theme only supports manual ad placements. Make sure you have manual ads configured under Ads Settings → Manual Ads."
                        : "This theme only supports frame ad placements. Configure your frame ad layout under Ads Settings → Frame Ads Layout."}
                    </p>
                  </div>
                )}

                {selectedTheme !== displayTheme.value ? (
                  <Button
                    onClick={() => handleApplyTheme(displayTheme.value)}
                    disabled={save.isPending}
                    className="w-fit bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
                  >
                    {save.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Apply {displayTheme.label}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="h-4 w-4" />
                    Currently active theme
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: "all" as const, label: "All Themes", count: THEME_OPTIONS.length },
          {
            key: "standard" as const,
            label: "Standard",
            count: THEME_OPTIONS.filter((t) => !t.tag).length,
          },
          {
            key: "manual" as const,
            label: "Manual Ads",
            count: THEME_OPTIONS.filter((t) => t.tag === "Manual Ads Only").length,
          },
          {
            key: "frame" as const,
            label: "Frame Ads",
            count: THEME_OPTIONS.filter((t) => t.tag === "Frame Ads Only").length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredThemes.map((theme) => (
          <ThemeCard
            key={theme.value}
            theme={theme}
            isActive={selectedTheme === theme.value}
            isPending={save.isPending}
            onSelect={() => handleApplyTheme(theme.value)}
            onHover={() => setPreviewTheme(theme.value)}
            onLeave={() => setPreviewTheme(null)}
          />
        ))}
      </div>

      {filteredThemes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Palette className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No themes match this filter.</p>
        </div>
      )}
    </>
  );
}

function ThemeCard({
  theme,
  isActive,
  isPending,
  onSelect,
  onHover,
  onLeave,
}: {
  theme: ThemeOption;
  isActive: boolean;
  isPending: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={isPending && !isActive}
      className={cn(
        "group relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50",
        isActive
          ? "border-orange-500 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10"
          : "border-border hover:border-orange-500/40 hover:shadow-md"
      )}
    >
      {/* Image */}
      <div className="aspect-video bg-black relative overflow-hidden">
        <img
          src={`/themes/${theme.value}.jpg`}
          alt={theme.label}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Active checkmark */}
        {isActive && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        {/* Hover overlay */}
        {!isActive && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              Click to apply
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="p-2.5 bg-card">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-medium",
              isActive ? "text-orange-400" : "text-foreground"
            )}
          >
            {theme.label}
          </span>
          {isActive && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0"
            >
              Active
            </Badge>
          )}
        </div>

        {/* Tag badge */}
        {theme.tag && (
          <Badge
            variant="outline"
            className={cn(
              "mt-1 text-[10px] px-1.5 py-0",
              theme.tagColor === "orange"
                ? "border-orange-500/30 text-orange-400/80"
                : "border-blue-500/30 text-blue-400/80"
            )}
          >
            {theme.tag}
          </Badge>
        )}
      </div>
    </button>
  );
}
