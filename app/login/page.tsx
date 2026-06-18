import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-primary">cinc</span> console
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to your Cinc/Chef server
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
