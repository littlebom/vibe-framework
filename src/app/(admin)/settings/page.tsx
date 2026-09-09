import { requirePermission, P, getTenantSettings } from "@/features/identity/server";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const ctx = await requirePermission(P.settingsManage);
  return <SettingsForm initial={await getTenantSettings(ctx.tenantId)} />;
}
