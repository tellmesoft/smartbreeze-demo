import { Pool, type PoolConfig } from "pg";

/**
 * pg v8 trata sslmode=require como verify-full y emite un warning.
 * Normalizamos la URL para usar verify-full explícitamente (comportamiento actual).
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  try {
    const parsed = new URL(connectionString.replace(/^postgresql:/, "postgres:"));
    const sslMode = parsed.searchParams.get("sslmode");

    if (sslMode === "require" || sslMode === "prefer" || sslMode === "verify-ca") {
      parsed.searchParams.set("sslmode", "verify-full");
    }

    return parsed.toString().replace(/^postgres:/, "postgresql:");
  } catch {
    return connectionString.replace(/sslmode=require/gi, "sslmode=verify-full");
  }
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está definida.");
  }
  return normalizeDatabaseUrl(url);
}

export function createPgPool(config?: Omit<PoolConfig, "connectionString">): Pool {
  const isServerless = Boolean(process.env.VERCEL);

  return new Pool({
    connectionString: getDatabaseUrl(),
    max: isServerless ? 1 : 10,
    idleTimeoutMillis: isServerless ? 5000 : 30000,
    connectionTimeoutMillis: 10000,
    ...config,
  });
}
