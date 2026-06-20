import { execSync } from "node:child_process";

if (process.env.SEED_DATABASE === "true") {
  console.log("SEED_DATABASE=true → cargando datos demo...");
  execSync("npx prisma db seed", { stdio: "inherit" });
} else {
  console.log("Seed omitido (definí SEED_DATABASE=true solo en el primer deploy).");
}
