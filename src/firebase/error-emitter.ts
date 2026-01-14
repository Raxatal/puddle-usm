import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We must use a type assertion here because the default EventEmitter type is too generic.
const errorEmitter = new EventEmitter() as unknown as {
  on<E extends keyof AppEvents>(event: E, listener: AppEvents[E]): () => void;
  off<E extends keyof AppEvents>(event: E, listener: AppEvents[E]): () => void;
  emit<E extends keyof AppEvents>(event: E, ...args: Parameters<AppEvents[E]>): boolean;
};

export { errorEmitter };
