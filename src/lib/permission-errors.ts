/**
 * Permission error types
 * 
 * This file does NOT have "use server" directive so that the PermissionError class
 * can be imported by both server action files and regular modules.
 */

export class PermissionError extends Error {
  constructor(message: string, public permissionName?: string, public context?: string) {
    super(message);
    this.name = "PermissionError";
  }
}
