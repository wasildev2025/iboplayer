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

/**
 * Available app themes. The `value` is the key persisted to the Theme table
 * and shipped to Android via /api/player/bootstrap. Each value maps to a
 * concrete accent palette in the Android client (see `paletteFor` in
 * android/.../ui/theme/Color.kt) — keep this list and the device-side map
 * in lockstep when adding a new theme.
 */
export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "theme_orange",
    label: "Sunset Orange",
    description: "The default — warm orange accents on deep navy.",
  },
  {
    value: "theme_blue",
    label: "Ocean Blue",
    description: "Cool blue accents for a calmer, news-room feel.",
  },
  {
    value: "theme_green",
    label: "Forest Green",
    description: "Vivid green accents — high contrast on dark surfaces.",
  },
];

export const AUTO_LAYOUT_OPTIONS = Array.from({ length: 14 }, (_, i) => ({
  value: `layout_${i}`,
  label: `Layout ${i + 1}`,
}));

export const FRAME_LAYOUT_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: `layout_${i}`,
  label: `Layout ${i + 1}`,
}));
