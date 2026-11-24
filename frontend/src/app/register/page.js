import RegisterForm from "@/components/RegisterForm";

export const metadata = {
  title: "Sign up | L.A.R.P",
};

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <RegisterForm />
    </main>
  );
}
