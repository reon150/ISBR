export const EVENT_SERVICE: string = 'IEventService';

export interface IEventService {
  emit(event: string, payload: unknown): void;
  emitAsync(event: string, payload: unknown): Promise<void>;
}
