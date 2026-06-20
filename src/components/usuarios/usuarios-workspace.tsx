"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncContent } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { tabActive } from "@/lib/selection-styles";
import { rolLabels } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { rolesUsuarioOptions } from "@/lib/usuarios";
import type { Rol } from "@/generated/prisma/client";

export type UsuarioRow = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatarSrc: string | null;
  ultimaVisitaLabel: string;
};

type Props = {
  usuarios: UsuarioRow[];
};

export function UsuariosWorkspace({ usuarios }: Props) {
  const { isPending: isNavigating, refresh } = usePendingRouter();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        rolLabels[u.rol].toLowerCase().includes(q)
    );
  }, [query, usuarios]);

  return (
    <AsyncContent pending={isNavigating || refreshing} label="Actualizando lista...">
    <div>
      <div className="mb-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">
            Usuarios
          </h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar usuarios"
                className="h-10 border-gray-300 pl-9 shadow-sm"
              />
            </div>
            <Button type="button" onClick={() => setModalOpen(true)} className="h-10 shrink-0 px-4">
              + Invitar usuario
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-5 border-b border-gray-200">
        <button
          type="button"
          className={cn("-mb-px px-1 pb-3 text-sm", tabActive)}
        >
          Usuarios
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-white text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Nombre completo</th>
                  <th className="px-5 py-3 font-medium">Rol</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filtered.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {usuario.avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={usuario.avatarSrc}
                              alt={usuario.nombre}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                              {usuario.nombre.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{usuario.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={rolBadgeVariant(usuario.rol)}>{rolLabels[usuario.rol]}</Badge>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{usuario.email}</td>
                      <td className="px-5 py-4 text-gray-600">{usuario.ultimaVisitaLabel}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invitar-usuario-title"
        >
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle id="invitar-usuario-title">Invitar usuario</CardTitle>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Cerrar"
                onClick={() => setModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <NuevoUsuarioForm
                onSuccess={() => {
                  setModalOpen(false);
                  startRefresh(() => {
                    refresh();
                  });
                }}
                onCancel={() => setModalOpen(false)}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
    </AsyncContent>
  );
}

function NuevoUsuarioForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      nombre: form.get("nombre"),
      email: form.get("email"),
      password: form.get("password"),
      rol: form.get("rol"),
    };

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear el usuario.");
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre completo *</Label>
        <Input id="nombre" name="nombre" placeholder="Ej. Laura Pérez" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Ej. laura@facultad.cl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rol">Rol *</Label>
        <Select id="rol" name="rol" defaultValue="TECNICO" required>
          {rolesUsuarioOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Contraseña"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} loading={loading} loadingText="Guardando...">
          Invitar usuario
        </Button>
      </div>
    </form>
  );
}

function rolBadgeVariant(rol: Rol): "default" | "success" | "warning" {
  if (rol === "ADMINISTRADOR") return "default";
  if (rol === "TECNICO") return "success";
  return "warning";
}
