import "server-only";
import { getLocale } from "@/shared/lib/i18n/server";
import { makeT, type TFunction } from "@/shared/lib/i18n/translate";
import { UI_MESSAGES } from "./index";

export { getLocale };
export async function getT(): Promise<TFunction> {
  return makeT(UI_MESSAGES, await getLocale());
}
