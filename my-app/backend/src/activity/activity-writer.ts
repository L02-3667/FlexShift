export interface AuditInput {
  actorUserId?: string;
  sessionId?: string;
  requestId?: string;
  deviceId?: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  payload?: unknown;
}

export abstract class ActivityWriter {
  abstract record(input: AuditInput): Promise<unknown>;
}
