import { AdminInvitationEditorClient } from "@/components/admin-invitation-editor-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminInvitationPage({ params }: PageProps) {
  const { slug } = await params;
  return <AdminInvitationEditorClient slug={slug} />;
}
