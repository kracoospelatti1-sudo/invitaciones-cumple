import { InvitationPageClient } from "@/components/invitation-page-client";

type InvitationPageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  return <InvitationPageClient token={token} />;
}
