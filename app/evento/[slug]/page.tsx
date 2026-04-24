import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { EventPageClient } from "@/components/event-page-client";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSessionToken,
} from "@/lib/admin-auth";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSessionToken(token)) {
    redirect("/");
  }

  const { slug } = await params;
  return <EventPageClient slug={slug} />;
}
