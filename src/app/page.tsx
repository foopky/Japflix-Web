// app/wordbook/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WordbookClient from "./WordbookClient";

// Expiry and refresh are handled in middleware.ts, which runs before this and
// is allowed to write cookies. By the time we get here the token is either
// fresh or the request has already been redirected to /login.
export default async function Page() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;
  const userId = cookieStore.get("userId")?.value;

  if (!authToken || !userId) {
    redirect("/login");
  }

  return <WordbookClient authToken={authToken} userId={userId} />;
}
