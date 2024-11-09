// app/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import MenuPage from "@/components/Common/Menu/MenuPage";
import { MenuProvider } from "@/context/MenuContext";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    // Redirige al login si no hay sesión
    redirect("/");
  }

  return (
    <MenuProvider>
      <div className="flex">
        <MenuPage />
        <main className="flex-grow">{children}</main>
      </div>
    </MenuProvider>
  );
}

