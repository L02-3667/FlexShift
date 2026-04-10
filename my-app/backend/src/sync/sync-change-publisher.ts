export interface ChangeInput {
  domain: string;
  entityType: string;
  entityId: string;
  operation?: 'upsert' | 'delete';
  userId?: string;
}

export abstract class SyncChangePublisher {
  abstract record(input: ChangeInput | ChangeInput[]): Promise<void>;
}
