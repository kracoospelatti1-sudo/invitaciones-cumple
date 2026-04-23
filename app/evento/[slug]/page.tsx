import { EventPageClient } from "@/components/event-page-client";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  return <EventPageClient slug={slug} />;
}
