import { ConflictException } from '@nestjs/common';

export interface DomainConflictPayload {
  code: string;
  message: string;
  entityType: string;
  entityId?: string;
  recoverable?: boolean;
  retryable?: boolean;
  resolution?: string;
  serverState?: unknown;
}

export class DomainConflictException extends ConflictException {
  constructor(payload: DomainConflictPayload) {
    super({
      error: 'DomainConflict',
      ...payload,
    });
  }
}
