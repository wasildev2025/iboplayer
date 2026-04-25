"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  Code,
  Key,
  KeyRound,
  ScrollText,
  Calendar,
  Asterisk,
  MessageSquare,
  Hash,
  Palette,
  University,
  Eye,
  LayoutGrid,
  Frame,
  Wand2,
  Trophy,
  Film,
  Upload,
  User,
  ChevronDown,
  X,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

interface NavGroup {
  title: string;
  icon: React.ElementType;
  children: { title: string; href: string; icon: React.ElementType }[];
}

const navItems = [
  { title: "DNS Settings", href: "/dns", icon: Settings },
  { title: "Credential Profiles", href: "/credential-profiles", icon: KeyRound },
  { title: "MAC Devices", href: "/mac-users", icon: Code },
  { title: "Activation Code", href: "/activation-codes", icon: Key },
  { title: "Set Expiration", href: "/trials", icon: Calendar },
  { title: "Audit Logs", href: "/audit-logs", icon: ScrollText },
  { title: "Set Demo", href: "/settings/demo", icon: Asterisk },
  { title: "Set Notification", href: "/settings/notification", icon: MessageSquare },
  { title: "Set MAC Length", href: "/settings/mac-length", icon: Hash },
  { title: "App Themes", href: "/settings/themes", icon: Palette },
];

const navGroups: NavGroup[] = [
  {
    title: "Login Page",
    icon: University,
    children: [
      { title: "Login Page Text", href: "/settings/login-text", icon: University },
    ],
  },
  {
    title: "Ads Settings",
    icon: Eye,
    children: [
      { title: "Ads Type", href: "/ads/type", icon: Eye },
      { title: "Auto Ads Layout", href: "/ads/auto-layout", icon: LayoutGrid },
      { title: "Frame Ads Layout", href: "/ads/frame-layout", icon: Frame },
      { title: "Manual Ads", href: "/ads/manual", icon: Wand2 },
    ],
  },
  {
    title: "Sport",
    icon: Trophy,
    children: [
      { title: "League ID", href: "/sports/leagues", icon: Trophy },
      { title: "League Widget ID", href: "/sports/widgets", icon: Trophy },
      { title: "Sport Events", href: "/sports/events", icon: Trophy },
    ],
  },
];

const bottomItems = [
  { title: "TMDB API", href: "/settings/tmdb", icon: Film },
  { title: "Remote Update", href: "/settings/remote-update", icon: Upload },
];

const configGroup: NavGroup = {
  title: "Configuration",
  icon: Settings,
  children: [
    { title: "Update Credentials", href: "/settings/credentials", icon: User },
  ],
};

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dns" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm">
              IPTV
            </div>
            <span className="text-sm font-semibold text-foreground">
              IPTV Player Panel
            </span>
          </Link>
          <button onClick={onToggle} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                active={pathname === item.href}
              />
            ))}

            {navGroups.map((group) => (
              <NavGroupComponent
                key={group.title}
                group={group}
                pathname={pathname}
              />
            ))}

            {bottomItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                active={pathname === item.href}
              />
            ))}

            <NavGroupComponent group={configGroup} pathname={pathname} />
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}

function NavLink({
  href,
  icon: Icon,
  title,
  active,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {title}
    </Link>
  );
}

function NavGroupComponent({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const isChildActive = group.children.some((c) => pathname === c.href);
  const [open, setOpen] = useState(isChildActive);
  const Icon = group.icon;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isChildActive
            ? "text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{group.title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="ml-4 space-y-1 border-l border-border pl-2">
          {group.children.map((child) => (
            <NavLink
              key={child.href}
              href={child.href}
              icon={child.icon}
              title={child.title}
              active={pathname === child.href}
            />
          ))}
        </div>
      )}
    </div>
  );
}
