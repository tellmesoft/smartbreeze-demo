import { LoginPageSkeleton } from "@/components/ui/loading";

export default function LoginLoading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8fafc] p-4">
      <LoginPageSkeleton />
    </div>
  );
}
