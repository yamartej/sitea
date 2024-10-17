"use client";
import { signIn, signOut, useSession } from "next-auth/react";

function AuthButton() {
  const { data: session } = useSession();

  if (session && session.user) {  // Verifica que session y session.user estén definidos
    return (
      <>
        {session.user.name} <br />
        <img 
          src={session.user.image || '/default-avatar.png'} 
          alt="User Avatar" 
          className="h-10 w-10 rounded-full"
        />
        <button onClick={() => signOut({
          callbackUrl: "/login",  
          })}>Sign out</button>
      </>
    );
  }
  
  return (
    <>
      Not signed in <br />
      <div className="space-y-2">
        <button onClick={() => signIn('github', {
            callbackUrl: "/dashboard",
          })} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Login with GitHub
        </button>
        <hr />
        <button onClick={() => signIn('google', {
            callbackUrl: "/dashboard",
          })} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Login with Google
        </button>
        <hr />
        <button onClick={() => signIn('facebook', {
            callbackUrl: "/dashboard",
          })} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Login with Facebook
        </button>
      </div>
    </>
  );
}

export default function NavMenu() {
  return (
    <div>
      <AuthButton />
    </div>
  );
}
