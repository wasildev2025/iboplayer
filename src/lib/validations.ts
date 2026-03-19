import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const dnsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().min(1, "DNS URL is required"),
});

export const macUserSchema = z.object({
  macAddress: z.string().min(1, "MAC address is required"),
  protection: z.boolean().default(false),
  title: z.string().min(1, "Server name is required"),
  url: z.string().min(1, "DNS is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const activationCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  url: z.string().min(1, "DNS is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  status: z.string().default("NotUsed"),
});

export const trialSchema = z.object({
  macAddress: z.string().min(1, "MAC address is required"),
  expireDate: z.string().min(1, "Expiration date is required"),
});

export const demoSchema = z.object({
  mplname: z.string().default(""),
  mdns: z.string().default(""),
  muser: z.string().default(""),
  mpass: z.string().default(""),
});

export const notificationSchema = z.object({
  messageOne: z.string().default(""),
  messageTwo: z.string().default(""),
});

export const macLengthSchema = z.object({
  length: z.number().int().min(4).max(12),
});

export const themeSchema = z.object({
  themeNo: z.string(),
});

export const loginTextSchema = z.object({
  loginTitle: z.string().default(""),
  loginSubtitle: z.string().default(""),
});

export const adsSettingSchema = z.object({
  adsType: z.enum(["auto", "manual"]),
});

export const layoutSchema = z.object({
  layout: z.string(),
});

export const manualAdSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().min(1, "Image URL is required"),
});

export const leagueSchema = z.object({
  leagueName: z.string().min(1, "League name is required"),
  leagueId: z.string().min(1, "League ID is required"),
});

export const sportSchema = z.object({
  api: z.string().default(""),
  headerName: z.string().default("Event"),
  borderColor: z.string().default("#000000"),
  bgColor: z.string().default("#000000"),
  textColor: z.string().default("#ffffff"),
});

export const tmdbSchema = z.object({
  tmdbKey: z.string().default(""),
});

export const remoteUpdateSchema = z.object({
  version: z.string().default("1.0"),
  url: z.string().default(""),
});

export const credentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});
