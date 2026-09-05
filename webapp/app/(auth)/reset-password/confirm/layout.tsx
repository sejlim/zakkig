import { cookies } from "next/headers";
import { translations, Locale } from "@/lib/translations";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "de";
  const dict = translations[locale] || translations.de;
  return {
    title: dict.setNewPassword,
  };
}

export default function ResetPasswordConfirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
