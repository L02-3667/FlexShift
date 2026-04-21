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
  constructor(message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'ApiUnauthorizedError';
  }
}
