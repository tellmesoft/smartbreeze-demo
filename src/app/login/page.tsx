import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex min-h-[calc(100dvh-2rem)] items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden">
            <div className="bg-[#f1f5f9] px-5 pb-4 pt-5">
              <BrandLogo
                link={false}
                priority
                variant="mark"
                showWordmark
                wordmarkLayout="centered"
                wordmarkClassName="text-base"
                className="w-full"
              />
            </div>
            <div className="border-b border-gray-200/80 bg-white px-5 py-3.5">
              <CardTitle className="text-center text-[#1D4ED8]">Iniciar sesión</CardTitle>
            </div>
            <CardContent className="space-y-4">
              <LoginForm />
              <div className="border-t border-gray-100 pt-4">
                <PwaInstallButton fullWidth variant="outline" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
