import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ViewSentencesPage from "./ViewSentencesPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    wordId: string | undefined;
  }>;
}) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;
  const userId = cookieStore.get("userId")?.value;

  if (!authToken || !userId) {
    redirect("/login");
  }
  const { wordId } = await searchParams;
  return (
    <ViewSentencesPage
      userId={userId}
      authToken={authToken}
      wordId={wordId ?? ""}
    />
  );
}
