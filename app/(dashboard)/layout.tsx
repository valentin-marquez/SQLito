import { ThemeSelector } from "@/_components/theme-selector";
import { Button } from "@/_components/ui/button"; // Assuming you have a Button component
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication in the layout to protect all dashboard routes
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("supabase_access_token");

  if (!accessToken) {
    redirect("/");
  }

  return (
    <div className="flex flex-col h-screen bg-sidebar overflow-hidden antialiased relative">
      {/* Logout button in left corner */}
      <div className="fixed top-4 left-4 z-20">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer border border-dashed border-sidebar-border rounded-none bg-sidebar/80 backdrop-blur-sm "
          type="submit"
          asChild
        >
          <Link href="/api/auth/logout">Logout</Link>
        </Button>
      </div>

      <div className="fixed top-4 right-4 z-20">
        <div className="p-1 border border-dashed border-sidebar-border rounded-none bg-sidebar/80 backdrop-blur-sm">
          <ThemeSelector />
        </div>
      </div>
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-sidebar-primary/5 to-transparent" />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
