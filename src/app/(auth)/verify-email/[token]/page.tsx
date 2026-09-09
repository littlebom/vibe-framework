import { VerifyEmailForm } from "./verify-email-form";

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <VerifyEmailForm token={token} />;
}
