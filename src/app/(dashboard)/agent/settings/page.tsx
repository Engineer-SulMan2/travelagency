import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfilePicture } from "@/lib/actions/profile";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { EditProfileForm } from "@/components/settings/edit-profile-form";
import { MyDocumentsSection } from "@/components/settings/my-documents-section";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";

export default async function AgentSettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, documents] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.subAgentDocument.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
      <p className="mb-6 text-sm text-slate-500">Manage your profile.</p>

      <div className="space-y-4">
        <EditProfileForm name={user.name} email={user.email} />

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-900">Profile picture</p>
          <AvatarUpload
            currentUrl={user.image}
            action={updateProfilePicture}
            fallbackLabel={user.name.charAt(0).toUpperCase()}
          />
        </div>

        <MyDocumentsSection
          documents={documents.map((d) => ({
            id: d.id,
            name: d.name,
            fileType: d.fileType,
            fileData: d.fileData,
            createdAt: d.createdAt.toISOString(),
          }))}
        />

        <DeleteAccountSection />
      </div>
    </div>
  );
}