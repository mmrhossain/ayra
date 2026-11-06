export type ErrorResponse = {
  statusCode: number;
  message: string;
};

export function mapPrismaError(code: string): ErrorResponse | null {
  if (code === "P2028") {
    return {
      statusCode: 503,
      message:
        "The operation timed out. Please retry; your order may not have been placed.",
    };
  }
  if (code === "P2024") {
    return {
      statusCode: 503,
      message: "The database is busy. Please retry in a moment.",
    };
  }
  return null;
}
