import type { Request } from "express";

// Express types req.params values as `string | string[]` (to account for wildcard
// routes). None of our routes use wildcards, so this just narrows back to string.
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}
