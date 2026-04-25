import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for IBO Player",
};

/** BOILERPLATE — review with legal counsel before public launch. */
export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-sm dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: 2026-04-25</p>

      <h2>1. Service</h2>
      <p>
        IBO Player provides a media-player application that streams content
        from third-party IPTV providers configured by the device administrator.
        We do not host, transmit, or own the underlying media content.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old (or the age of majority in your
        jurisdiction) to use this service.
      </p>

      <h2>3. Acceptable use</h2>
      <ul>
        <li>Do not attempt to circumvent rate limits, authentication, or DRM.</li>
        <li>Do not redistribute, resell, or scrape content delivered through the app.</li>
        <li>Do not use the service in violation of any law applicable to you or your IPTV provider.</li>
      </ul>

      <h2>4. Content</h2>
      <p>
        All channel content is sourced from a third-party IPTV provider whose
        service you have separately subscribed to via an activation code. We
        make no warranties as to the legality, availability, or quality of
        that content. Disputes about content belong with the provider.
      </p>

      <h2>5. No warranty</h2>
      <p>
        The service is provided &quot;as is&quot;. We disclaim all warranties,
        express or implied, including merchantability and fitness for purpose,
        to the maximum extent permitted by law.
      </p>

      <h2>6. Termination</h2>
      <p>
        We may suspend or revoke your activation at any time for violations of
        these terms or for abuse.
      </p>

      <h2>7. Contact</h2>
      <p>Operator: [Your business / contact name]<br />Email: [Your contact email]</p>

      <p className="text-muted-foreground">
        This document is a starting template. Have it reviewed by a qualified
        attorney for your jurisdiction before relying on it.
      </p>
    </main>
  );
}
