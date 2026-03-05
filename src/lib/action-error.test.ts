import { getActionErrorMessage, getSettledErrors } from "./action-error";

describe("getActionErrorMessage", () => {
  it("returns message from an ActionResult with status false", () => {
    const result = { status: false, message: "Permission denied", data: null };
    expect(getActionErrorMessage(result)).toBe("Permission denied");
  });

  it("returns message from an Error instance", () => {
    const error = new Error("Something broke");
    expect(getActionErrorMessage(error)).toBe("Something broke");
  });

  it("returns a plain string as-is", () => {
    expect(getActionErrorMessage("Network error")).toBe("Network error");
  });

  it("returns fallback for null", () => {
    expect(getActionErrorMessage(null)).toBe("An unexpected error occurred");
  });

  it("returns fallback for undefined", () => {
    expect(getActionErrorMessage(undefined)).toBe("An unexpected error occurred");
  });

  it("returns custom fallback when provided", () => {
    expect(getActionErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
  });

  it("returns fallback for empty string", () => {
    expect(getActionErrorMessage("")).toBe("An unexpected error occurred");
  });

  it("returns fallback for an object without status/message", () => {
    expect(getActionErrorMessage({ foo: "bar" })).toBe("An unexpected error occurred");
  });

  it("returns message from an ActionResult even when status is true", () => {
    const result = { status: true, message: "Success", data: {} };
    expect(getActionErrorMessage(result)).toBe("Success");
  });
});

describe("getSettledErrors", () => {
  it("returns empty array when all results are successful", () => {
    const results: PromiseSettledResult<{ status: boolean; message: string; data: unknown }>[] = [
      { status: "fulfilled", value: { status: true, message: "OK", data: null } },
      { status: "fulfilled", value: { status: true, message: "OK", data: null } },
    ];
    expect(getSettledErrors(results)).toEqual([]);
  });

  it("returns error messages for rejected promises", () => {
    const results: PromiseSettledResult<{ status: boolean; message: string; data: unknown }>[] = [
      { status: "fulfilled", value: { status: true, message: "OK", data: null } },
      { status: "rejected", reason: new Error("Network failure") },
    ];
    expect(getSettledErrors(results)).toEqual(["Network failure"]);
  });

  it("returns error messages for fulfilled but failed action results", () => {
    const results: PromiseSettledResult<{ status: boolean; message: string; data: unknown }>[] = [
      { status: "fulfilled", value: { status: false, message: "You do not have permission", data: null } },
      { status: "fulfilled", value: { status: true, message: "OK", data: null } },
    ];
    expect(getSettledErrors(results)).toEqual(["You do not have permission"]);
  });

  it("handles mixed failures", () => {
    const results: PromiseSettledResult<{ status: boolean; message: string; data: unknown }>[] = [
      { status: "rejected", reason: "Connection refused" },
      { status: "fulfilled", value: { status: false, message: "Healthcare provider not found", data: null } },
      { status: "fulfilled", value: { status: true, message: "OK", data: null } },
    ];
    const errors = getSettledErrors(results);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toBe("Connection refused");
    expect(errors[1]).toBe("Healthcare provider not found");
  });

  it("uses fallback for rejected promise with no message", () => {
    const results: PromiseSettledResult<{ status: boolean; message: string; data: unknown }>[] = [
      { status: "rejected", reason: null },
    ];
    expect(getSettledErrors(results)).toEqual(["An unexpected error occurred"]);
  });
});
