// src/components/Dashboard.tsx
"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const ACTIVE_LINK = "text-white bg-blue-600 p-2 rounded";
const INACTIVE_LINK = "text-gray-500 p-2 rounded hover:bg-blue-600 hover:text-white";
interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardProps {
  user: User | undefined;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { data: session} = useSession();
  const userImage = session?.user.image || '/default-avatar.png'; // Ruta a tu imagen de avatar predeterminada

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <div className="bg-white shadow p-4 rounded">
        <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
        {session ? (
          <div>
            <div className="flex items-center mb-4">
              <img src={userImage} alt="User Avatar" className="w-12 h-12 rounded-full mr-4" />
              <div>
                <h2 className="text-xl font-semibold">{session.user?.name}</h2>
                <p className="text-gray-500">{session.user?.email}</p>
              </div>
            </div>
            <button className="bg-red-500 text-white p-2 rounded" onClick={() => signOut({
          callbackUrl: "/",  
          })}>Sign Out</button>
          </div>
        ) : (
          <p>Please log in.</p>
        )}
      </div>

      <nav className="mt-6">
        <ul className="space-y-2">
          <li>
            <Link href="/products" className={ACTIVE_LINK}>
              Products
            </Link>
          </li>
          <li>
            <Link href="/categories" className={INACTIVE_LINK}>
              Categories
            </Link>
          </li>
          <li>
            <Link href="/sales" className={INACTIVE_LINK}>
              Sales
            </Link>
          </li>
          <li>
            <Link href="/inventory" className={INACTIVE_LINK}>
              Inventory
            </Link>
          </li>
          <li>
            <Link href="/suppliers" className={INACTIVE_LINK}>
              Suppliers
            </Link>
          </li>
          <li>
            <Link href="/customers" className={INACTIVE_LINK}>
              Customers
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Dashboard;

