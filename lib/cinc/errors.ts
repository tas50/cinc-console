/** Error thrown for any non-2xx response from the cinc server. */
export class CincError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string,
  ) {
    super(message ?? `cinc server returned ${status}`);
    this.name = "CincError";
  }

  get forbidden() {
    return this.status === 403;
  }

  get notFound() {
    return this.status === 404;
  }

  get conflict() {
    return this.status === 409;
  }
}

export function isCincError(e: unknown): e is CincError {
  return e instanceof CincError;
}
