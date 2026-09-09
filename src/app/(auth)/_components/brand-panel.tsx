"use client";
import { useT } from "@/shared/lib/i18n/client";
import { BrandMarkIcon } from "./icons";

export function BrandPanel() {
  const t = useT();
  return (
    <aside className="brandside">
      <div className="mark"><i><BrandMarkIcon /></i>{t("app.name")}</div>
      <div className="lead">
        <div className="eyebrow"><span>{t("auth.brand.eyebrow")}</span></div>
        <h1>{t("auth.brand.title")}</h1>
        <p>{t("auth.brand.subtitle")}</p>
      </div>
      <p className="foot">{t("app.tagline")}</p>
    </aside>
  );
}
