import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CreateSentencesPage from "./CreateSentencesPage";

export default async function Page({
  searchParams,
}: {
  searchParams: {
    wordId: string | undefined;
    word: string | undefined;
  };
}) {
  // 서버에서 쿠키 읽기
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;
  const userId = cookieStore.get("userId")?.value;

  // console.log("Server - authToken:", authToken);
  // console.log("Server - userId:", userId);

  if (!authToken || !userId) {
    redirect("/login"); // 로그인 페이지로 리다이렉트
  }
  const { wordId, word } = await searchParams;
  return (
    <CreateSentencesPage
      authToken={authToken}
      userId={userId}
      wordId={wordId ?? ""}
      word={word ?? ""}
    />
  );
}
