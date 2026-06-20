"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { rolLabels } from "@/lib/navigation";
import {
  AVATAR_ACCEPT,
  initialsAvatarPreview,
  MAX_AVATAR_BYTES,
  userAvatarSrc,
} from "@/lib/usuarios";
import { formatDateTime } from "@/lib/utils";
import type { Rol } from "@/generated/prisma/client";

export type PerfilData = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatarBase64: string | null;
  ultimaVisita: string;
};

type Props = {
  user: PerfilData;
};

export function PerfilForm({ user }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(user.nombre);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    userAvatarSrc(user.avatarBase64, user.nombre, user.rol)
  );
  const [avatarPayload, setAvatarPayload] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const payload: Record<string, unknown> = { nombre, email };
    if (password) {
      payload.password = password;
      payload.passwordConfirm = passwordConfirm;
    }
    if (avatarPayload !== undefined) {
      payload.avatarBase64 = avatarPayload;
    }

    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar el perfil.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setNombre(data.nombre);
    setEmail(data.email);
    setAvatarPreview(userAvatarSrc(data.avatarBase64, data.nombre, data.rol));
    setPassword("");
    setPasswordConfirm("");
    setAvatarPayload(undefined);
    setLoading(false);
    router.refresh();
  }

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Seleccioná un archivo de imagen válido.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError("La imagen no puede superar 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;
      setAvatarPreview(result);
      setAvatarPayload(result);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarPreview(initialsAvatarPreview(nombre || user.nombre, user.rol));
    setAvatarPayload(null);
    setError("");
  }

  const initials = (nombre || user.nombre).slice(0, 2).toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-br from-[#EFF6FF] to-white px-6 py-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <div className="relative">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={nombre}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-2xl font-semibold text-gray-600 shadow-md">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#2563EB] text-white shadow-sm transition-colors hover:bg-blue-700"
                aria-label="Cambiar foto de perfil"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_ACCEPT}
                className="sr-only"
                onChange={handleAvatarPick}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">{nombre || user.nombre}</h2>
              <p className="mt-0.5 text-sm text-gray-500">{email}</p>
              <Badge variant="default" className="mt-2">
                {rolLabels[user.rol]}
              </Badge>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Subir foto
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar}>
              <ImageOff className="h-4 w-4" />
              Restaurar iniciales
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-gray-400 sm:text-left">
            JPG, PNG o WebP · máximo 2 MB
          </p>
        </div>

        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="perfil-nombre">Nombre completo</Label>
              <Input
                id="perfil-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="perfil-email">Correo electrónico</Label>
              <Input
                id="perfil-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil-password">Nueva contraseña</Label>
              <Input
                id="perfil-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Opcional"
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil-password-confirm">Confirmar contraseña</Label>
              <Input
                id="perfil-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Opcional"
                autoComplete="new-password"
                minLength={6}
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Última visita:</span>{" "}
            {formatDateTime(user.ultimaVisita)}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? (
            <p className="text-sm text-green-600">Perfil actualizado correctamente.</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading} loadingText="Guardando...">
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
