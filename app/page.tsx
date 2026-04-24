import { cookies } from "next/headers";

import { HomeClient } from "@/components/home-client";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSessionToken,
} from "@/lib/admin-auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const initialIsAdmin = isValidAdminSessionToken(token);

  return <HomeClient initialIsAdmin={initialIsAdmin} />;
}
