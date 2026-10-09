const PROTECTED_PATTERNS = [
  /\border\b/i,
  /\borders\b/i,
  /\btracking\b/i,
  /\btrack\b/i,
  /\brefund\b/i,
  /\breturn\b/i,
  /\binvoice\b/i,
  /\bpayment\b/i,
  /\baccount\b/i,
  /\bpassword\b/i,
  /\baddress\b/i,
  /\bwishlist\b/i,
  /\bmy email\b/i,
  /\bmy phone\b/i,
  /\bঅর্ডার\b/,
  /\bট্র্যাক\b/,
  /\bরিফান্ড\b/,
  /\bরিটার্ন\b/,
  /\bঅ্যাকাউন্ট\b/,
  /\bপাসওয়ার্ড\b/,
  /\bঠিকানা\b/,
];

export function isProtectedIntent(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(text));
}
