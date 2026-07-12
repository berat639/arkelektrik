import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="admin-layout container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {children}
    </div>
  );
}
