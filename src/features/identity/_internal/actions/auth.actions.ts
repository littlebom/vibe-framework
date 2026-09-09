"use server";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "../validations/auth";
import { requestPasswordReset, resetPasswordWithToken, changeOwnPassword } from "../services/password.service";
import { requireSession } from "../session";

export async function forgotPasswordAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const { email } = forgotPasswordSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    await requestPasswordReset(email);
  });
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const { token, password } = resetPasswordSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    await resetPasswordWithToken(token, password);
  });
}

export async function changePasswordAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requireSession();
    const { currentPassword, newPassword } = changePasswordSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    await changeOwnPassword(ctx.userId, currentPassword, newPassword);
  });
}
