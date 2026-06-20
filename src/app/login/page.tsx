import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2563EB] text-xl font-bold text-white">
            SB
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Smartbreeze HVAC</h1>
          <p className="mt-2 text-sm text-gray-500">Demo comercial — acceso simulado por rol</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-6 rounded-md bg-gray-50 p-4 text-xs text-gray-600">
              <p className="mb-2 font-semibold text-gray-800">Credenciales demo</p>
              <ul className="space-y-1">
                <li>admin@smartbreeze.local / demo123</li>
                <li>tecnico@smartbreeze.local / demo123</li>
                <li>encargado@smartbreeze.local / demo123</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
