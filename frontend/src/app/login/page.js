import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Log in | L.A.R.P",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <LoginForm />
    </main>
  );
}
