import { SidebarDesktop, MobileTopNav } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isAdmin = Boolean(session?.isAdmin);

  return (
    <div className="flex w-full flex-1">
      <SidebarDesktop isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopNav isAdmin={isAdmin} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
