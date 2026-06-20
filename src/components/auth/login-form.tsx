"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const demoAccounts = [
  { email: "admin@smartbreeze.local", label: "Administrador" },
  { email: "tecnico@smartbreeze.local", label: "Técnico" },
  { email: "encargado@smartbreeze.local", label: "Encargado" },
] as const;

const defaultDemoEmail = demoAccounts[0].email;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(defaultDemoEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError("Credenciales inválidas.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {demoAccounts.map((account) => {
          const selected = email === account.email;
          return (
          <button
            key={account.email}
            type="button"
            aria-pressed={selected}
            onClick={() => setEmail(account.email)}
            className={cn(
              "rounded-xl border px-4 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "border-[#2563EB] bg-blue-50 text-[#2563EB] ring-1 ring-[#2563EB]/20"
                : "border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-700"
            )}
          >
            {account.label}
          </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="w-full" loading={loading} loadingText="Ingresando...">
        Ingresar
      </Button>
    </form>
  );
}
