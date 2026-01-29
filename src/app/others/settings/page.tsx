import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SettingsPageClient from "./SettingsPageClient";

export default async function Page() {
  // 서버에서 쿠키 읽기
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;
  const userId = cookieStore.get("userId")?.value;

  if (!authToken || !userId) {
    redirect("/login"); // 로그인 페이지로 리다이렉트
  }

  return <SettingsPageClient authToken={authToken} userId={userId} />;
}
