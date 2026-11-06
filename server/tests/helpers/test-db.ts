type GuardOptions = {
  allowNonTestDb?: boolean;
};

export function assertSafeTestDatabase(
  databaseUrl: string | undefined,
  options: GuardOptions = {}
): void {
  if (options.allowNonTestDb) return;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for database-backed tests. Set SKIP_DB_SETUP=1 for unit-only suites."
    );
  }

  let databaseName: string;

  try {
    const parsed = new URL(databaseUrl);
    databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  } catch {
    throw new Error(
      "DATABASE_URL is not a valid URL. Refusing to run database setup."
    );
  }

  if (!/test/i.test(databaseName)) {
    throw new Error(
      `Refusing to run database setup against "${databaseName}": the database name must contain "test" (for example ayra_test). Set ALLOW_NON_TEST_DB=1 only for a disposable database.`
    );
  }
}
