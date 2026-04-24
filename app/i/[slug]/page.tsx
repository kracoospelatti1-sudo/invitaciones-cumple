import { InvitationLandingClient } from "@/components/invitation-landing-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function InvitationPage({ params }: PageProps) {
  const { slug } = await params;
  return <InvitationLandingClient slug={slug} />;
}
