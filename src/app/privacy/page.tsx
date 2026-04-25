import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for IBO Player",
};

/**
 * BOILERPLATE — review with legal counsel before public launch.
 * Tailor the operator name, jurisdiction, and contact email to your
 * actual business.
 */
export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-sm dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: 2026-04-25</p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Device identifier (MAC address)</strong>: used to recognize
          your device and link it to your activation.
        </li>
        <li>
          <strong>Device name</strong> (e.g. &quot;Samsung Galaxy S21&quot;):
          submitted on first activation so administrators can identify devices
          they manage.
        </li>
        <li>
          <strong>Activation code</strong>: the code you enter on first launch.
          Stored to prevent reuse.
        </li>
        <li>
          <strong>IP address</strong>: captured for rate-limiting and abuse
          prevention. Not used for advertising or tracking.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <p>
        We do not collect your real name, email, location data, contact list,
        photos, browsing history outside this app, or advertising identifiers.
        We do not sell or share your data with third parties for marketing.
      </p>

      <h2>How we store data</h2>
      <p>
        Data is stored on managed Postgres infrastructure (Neon) accessed only
        by the application server. Channel content is fetched from third-party
        IPTV providers as configured by the administrator and is not stored
        persistently per-device.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request deletion of your device record by contacting the
        operator below. Deletion removes your MAC, device name, and any
        playlists associated with your activation.
      </p>

      <h2>Contact</h2>
      <p>
        Operator: [Your business / contact name]
        <br />
        Email: [Your contact email]
      </p>

      <p className="text-muted-foreground">
        This policy is provided as a starting template. Have it reviewed by a
        qualified attorney for your jurisdiction before relying on it for
        compliance with GDPR, CCPA, or similar regulations.
      </p>
    </main>
  );
}
