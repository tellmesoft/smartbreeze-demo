import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-[100dvh] bg-[#f8fafc] p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="absolute left-6 top-6">
        <BrandLogo link={false} priority variant="mark" className="h-16 w-16" />
      </div>

      <div className="flex min-h-[calc(100dvh-2rem)] items-center justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar sesión</CardTitle>
            </CardHeader>
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
