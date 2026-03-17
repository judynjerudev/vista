export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const api = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => {
      return { error: response.statusText };
    });
    throw new ApiError(response.status, body.error ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};
