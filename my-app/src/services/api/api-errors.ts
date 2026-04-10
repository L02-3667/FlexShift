export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiUnauthorizedError extends ApiError {
  constructor(message = 'Phien dang nhap da het han. Vui long dang nhap lai.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'ApiUnauthorizedError';
  }
}
