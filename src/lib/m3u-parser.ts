export function parseM3uUrl(m3uLink: string) {
  const serverUrl = m3uLink.split("/get.php")[0] || "";
  const params = new URLSearchParams(m3uLink.split("?")[1] || "");
  return {
    url: serverUrl,
    username: params.get("username") || "",
    password: params.get("password") || "",
  };
}

export function generateActivationCode(): string {
  return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

export function formatMacAddress(length: number): string {
  const pairs = length / 2;
  return Array.from({ length: pairs }, () => "XX").join(":");
}
