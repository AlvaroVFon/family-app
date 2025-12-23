export const INJECT_DATABASE = Symbol('INJECT_DATABASE');

export interface DatabaseService {
  connect(): Promise<void>;
  getDBConnection<T = any>(): T;
  disconnect(): Promise<void>;
}
