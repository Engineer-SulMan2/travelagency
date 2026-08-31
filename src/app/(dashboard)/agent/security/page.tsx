import { ChangePasswordForm } from "@/components/security/change-password-form";
import { AuthenticatorSetup } from "@/components/security/authenticator-setup";
import { SecurityPanel } from "@/components/security/security-panel";

export default function AgentSecurityPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Security</h1>
      <p className="mb-6 text-sm text-slate-500">
        Change your password, manage trusted devices, and review recent sign-in activity.
      </p>
      <div className="mb-4">
        <ChangePasswordForm />
      </div>
      <div className="mb-4">
        <AuthenticatorSetup />
      </div>
      <SecurityPanel />
    </div>
  );
}