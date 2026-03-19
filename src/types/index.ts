export type SettingsKey =
  | "demo"
  | "notification"
  | "mac-length"
  | "themes"
  | "login-text"
  | "ads-type"
  | "auto-layout"
  | "frame-layout"
  | "sports"
  | "tmdb"
  | "remote-update"
  | "credentials";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

export interface LeagueOption {
  name: string;
  id: string;
}

export const LEAGUE_OPTIONS: LeagueOption[] = [
  { name: "English Premier League", id: "4328" },
  { name: "English League Championship", id: "4329" },
  { name: "Scottish Premier League", id: "4330" },
  { name: "German Bundesliga", id: "4331" },
  { name: "Italian Serie A", id: "4332" },
  { name: "French Ligue 1", id: "4334" },
  { name: "Spanish La Liga", id: "4335" },
  { name: "Greek Superleague Greece", id: "4336" },
  { name: "Dutch Eredivisie", id: "4337" },
  { name: "Belgian Pro League", id: "4338" },
  { name: "Turkish Super Lig", id: "4339" },
  { name: "Danish Superliga", id: "4340" },
  { name: "Portuguese Primeira Liga", id: "4344" },
  { name: "American Major League Soccer", id: "4346" },
  { name: "Swedish Allsvenskan", id: "4347" },
  { name: "Mexican Primera League", id: "4350" },
  { name: "Brazilian Serie A", id: "4351" },
  { name: "Ukrainian Premier League", id: "4344" },
  { name: "Norwegian Eliteserien", id: "4358" },
  { name: "Chinese Super League", id: "4359" },
];

export const MAC_LENGTH_OPTIONS = [
  { value: 4, label: "XX:XX" },
  { value: 6, label: "XX:XX:XX" },
  { value: 8, label: "XX:XX:XX:XX" },
  { value: 10, label: "XX:XX:XX:XX:XX" },
  { value: 12, label: "XX:XX:XX:XX:XX:XX" },
];

export interface ThemeOption {
  value: string;
  label: string;
  tag?: string;
  tagColor?: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: "theme_0", label: "Theme 1", description: "Classic dark layout with standard navigation", tag: "All Ads" },
  { value: "theme_1", label: "Theme 2", description: "Minimal dark interface with clean lines" },
  { value: "theme_2", label: "Theme 3", description: "Modern gradient-based dark UI" },
  { value: "theme_3", label: "Theme 4", description: "Compact layout with sidebar navigation" },
  { value: "theme_4", label: "Theme 5", description: "Wide-screen optimized with large tiles" },
  { value: "theme_5", label: "Theme 6", description: "Premium dark theme with accent colors" },
  { value: "theme_6", label: "Theme 7", description: "Grid-based content with card layout" },
  { value: "theme_7", label: "Theme 8", description: "Cinematic fullscreen browsing experience" },
  { value: "theme_8", label: "Theme 9", description: "Streamlined menu with quick access" },
  { value: "theme_9", label: "Theme 10", tag: "Manual Ads Only", tagColor: "orange", description: "Banner-ready layout for manual ad placement" },
  { value: "theme_10", label: "Theme 11", tag: "Manual Ads Only", tagColor: "orange", description: "Carousel-style with manual ad zones" },
  { value: "theme_11", label: "Theme 12", tag: "Manual Ads Only", tagColor: "orange", description: "Split-view layout optimized for ad display" },
  { value: "theme_12", label: "Theme 13", description: "Elegant dark with subtle gradients" },
  { value: "theme_13", label: "Theme 14", description: "Modern card-based content browser" },
  { value: "theme_14", label: "Theme 15", description: "Clean minimal with focused content" },
  { value: "theme_15", label: "Theme 16", tag: "Frame Ads Only", tagColor: "blue", description: "Frame ad zones with embedded content" },
  { value: "theme_16", label: "Theme 17", tag: "Frame Ads Only", tagColor: "blue", description: "Multi-frame layout with ad integration" },
];

export const AUTO_LAYOUT_OPTIONS = Array.from({ length: 14 }, (_, i) => ({
  value: `layout_${i}`,
  label: `Layout ${i + 1}`,
}));

export const FRAME_LAYOUT_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: `layout_${i}`,
  label: `Layout ${i + 1}`,
}));
