import { redirect } from "next/navigation";
import { SidebarDesktop, MobileTopNav } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Segunda camada de proteção (além do proxy): garante que nenhuma página
  // dentro do grupo (app) renderiza sem sessão válida, mesmo que o proxy
  // seja contornado por algum jeito.
  if (!session) redirect("/login");
  const isAdmin = Boolean(session.isAdmin);

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
