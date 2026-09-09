import { requireSession, getDashboardStats } from "@/features/identity/server";
import { getT } from "@/i18n/server";
import { LiyonCard } from "@/shared/components/liyon";

export default async function DashboardPage() {
  const ctx = await requireSession();
  const [t, stats] = await Promise.all([getT(), getDashboardStats(ctx.tenantId)]);
  const cards = [
    { label: t("dash.users"), value: stats.users },
    { label: t("dash.activeUsers"), value: stats.activeUsers },
    { label: t("dash.roles"), value: stats.roles },
  ];
  return (
    <>
      <header className="ph">
        <h1>{t("dash.title")}</h1>
        <p className="sub">{t("dash.welcome", { name: ctx.userName })}</p>
      </header>
      <div className="kpis">
        {cards.map((c) => (
          <LiyonCard key={c.label} className="kpi">
            <span className="lab">{c.label}</span>
            <b className="val num">{c.value}</b>
          </LiyonCard>
        ))}
      </div>
    </>
  );
}
