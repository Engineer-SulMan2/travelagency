import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/security/change-password-form";
import { AuthenticatorSetup } from "@/components/security/authenticator-setup";
import { SecurityPanel } from "@/components/security/security-panel";
import { TeamSecurityPanel } from "@/components/security/team-security-panel";

export default async function AdminSecurityPage() {
  const session = await auth();
  const isSuperAdmin = session?.user.role === "SUPER_ADMIN";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Security</h1>
      <p className="mb-6 text-sm text-slate-500">
        Change your password, manage trusted devices, and review sign-in activity across your agency.
      </p>
      <div className="mb-4">
        <ChangePasswordForm />
      </div>
      <div className="mb-4">
        <AuthenticatorSetup />
      </div>
      <div className="mb-4">
        <SecurityPanel />
      </div>
      {!isSuperAdmin && <TeamSecurityPanel />}
    </div>
  );
}