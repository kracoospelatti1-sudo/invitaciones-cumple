type ErrorWithCode = Error & {
  code?: string;
};

const DB_SETUP_MESSAGE =
  "No se pudo conectar a la base de datos. Revisa DATABASE_URL en .env y luego ejecuta npm run db:push.";

export function getPersistenceErrorMessage(error: unknown): string {
  const maybeError = error as ErrorWithCode;
  const code = maybeError?.code;
  const message = typeof maybeError?.message === "string" ? maybeError.message : "";
  const dbUrl = process.env.DATABASE_URL ?? "";

  if (dbUrl.includes("USUARIO:CLAVE@HOST") || dbUrl.includes("NOMBRE_DB")) {
    return DB_SETUP_MESSAGE;
  }

  if (code === "P1000" || code === "P1001" || code === "P1017") {
    return DB_SETUP_MESSAGE;
  }

  if (
    message.includes("Can't reach database server") ||
    message.includes("Authentication failed") ||
    message.includes("Unknown database")
  ) {
    return DB_SETUP_MESSAGE;
  }

  if (code === "P2021") {
    return "La base esta conectada, pero faltan tablas. Ejecuta npm run db:push.";
  }

  return "Ocurrio un error al guardar en la base de datos.";
}
