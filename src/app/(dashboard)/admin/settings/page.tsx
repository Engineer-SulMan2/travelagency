import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateProfilePicture,
  removeProfilePicture,
  updateAgencyLogo,
  removeAgencyLogo,
  updateAgencyStamp,
  removeAgencyStamp,
} from "@/lib/actions/profile";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { EditProfileForm } from "@/components/settings/edit-profile-form";
import { AgencyInfoForm } from "@/components/settings/agency-info-form";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const agency = user.agencyId
    ? await prisma.agency.findUnique({ where: { id: user.agencyId } })
    : null;

  const tabs = agency
    ? [
        { id: "profile", label: "Profile" },
        { id: "branding", label: "Branding" },
        { id: "business", label: "Business & Policies" },
      ]
    : [{ id: "profile", label: "Profile" }];

  const panels: Record<string, React.ReactNode> = {
    profile: (
      <div className="space-y-4">
        <EditProfileForm name={user.name} email={user.email} />
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-900">Profile picture</p>
          <AvatarUpload
            currentUrl={user.image}
            action={updateProfilePicture}
            onRemove={removeProfilePicture}
            fallbackLabel={user.name.charAt(0).toUpperCase()}
          />
        </div>
      </div>
    ),
  };

  if (agency) {
    panels.branding = (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-900">Agency logo</p>
          <p className="mb-4 -mt-2 text-xs text-slate-400">Shown at the top of the sidebar for everyone in your agency.</p>
          <AvatarUpload
            currentUrl={agency.logoUrl}
            action={updateAgencyLogo}
            onRemove={removeAgencyLogo}
            shape="square"
            fallbackLabel={agency.name.charAt(0).toUpperCase()}
          />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-900">Invoice stamp / signature</p>
          <p className="mb-4 -mt-2 text-xs text-slate-400">Shown on printed invoices, next to the total.</p>
          <AvatarUpload
            currentUrl={agency.stampUrl}
            action={updateAgencyStamp}
            onRemove={removeAgencyStamp}
            shape="square"
            fallbackLabel="—"
          />
        </div>
      </div>
    );

    panels.business = (
      <AgencyInfoForm
        businessHours={agency.businessHours ?? ""}
        termsAndConditions={agency.termsAndConditions ?? ""}
        approvalThreshold={Number(agency.approvalThreshold)}
        currency={agency.currency}
        taxId={agency.taxId ?? ""}
        flightCancellationPolicy={agency.flightCancellationPolicy ?? ""}
        hotelCancellationPolicy={agency.hotelCancellationPolicy ?? ""}
        packageCancellationPolicy={agency.packageCancellationPolicy ?? ""}
        visaCancellationPolicy={agency.visaCancellationPolicy ?? ""}
      />
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
      <p className="mb-6 text-sm text-slate-500">Manage your profile, agency branding, and business rules.</p>

      <SettingsTabs tabs={tabs} panels={panels} />
    </div>
  );
}