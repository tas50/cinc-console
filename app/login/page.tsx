import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl bg-white px-6 py-5 shadow-lg shadow-black/30">
            <Image
              src="/cinc/logo.png"
              alt="Cinc"
              width={84}
              height={94}
              priority
            />
          </div>
          <h1 className="text-lg font-medium tracking-tight text-text">console</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your Cinc server</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
