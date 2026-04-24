import { HostSummaryClient } from "@/components/host-summary-client";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function HostPanelPage({ params }: PageProps) {
  const { token } = await params;
  return <HostSummaryClient token={token} />;
}
