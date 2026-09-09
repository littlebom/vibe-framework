import { requireSession } from "@/features/identity/server";
import { ProfileForm } from "./_components/profile-form";

export default async function MePage() {
  const ctx = await requireSession();
  return <ProfileForm initial={{ name: ctx.userName, locale: ctx.locale ?? "th", email: ctx.email }} />;
}
