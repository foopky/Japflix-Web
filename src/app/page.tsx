// app/wordbook/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WordbookClient from "./WordbookClient";

export default async function Page() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;
  const userId = cookieStore.get("userId")?.value;

  // console.log("Server - authToken:", authToken);
  // console.log("Server - userId:", userId);

  if (!authToken || !userId) {
    redirect("/login");
  }

  return <WordbookClient authToken={authToken} userId={userId} />;
}
