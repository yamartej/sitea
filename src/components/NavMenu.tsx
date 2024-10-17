"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const ACTIVE_ROUTE = "py-1 px-2 text-gray-300 bg-gray-700";
const INACTIVE_ROUTE =
  "py-1 px-2 text-gray-500 hover:text-gray-300 hover:bg-gray-700";

function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        {session?.user?.name} <br />
        <img 
          src={session.user.image || '/default-avatar.png'} 
          alt="User Avatar" 
          className="h-10 w-10 rounded-full"
        />
        <button onClick={() => signOut({
          callbackUrl: "/login",  
          })}>Sign outt</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <div className="space-y-2">
        <button onClick={() => signIn('github', {
            callbackUrl: "/dashboard",  // Redirigir al dashboard después del login
          })} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Login with GitHub
        </button>
        <hr />
        <button onClick={() => signIn('google')} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Login with Google
        </button>
        <hr />
        <button onClick={() => signIn('facebook')} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Login with Facebook
        </button>
      </div>
    </>
  );
}

export default function NavMenu() {
  const pathname = usePathname();
  return (
    <div>
      <AuthButton />
    </div>
  );
}

