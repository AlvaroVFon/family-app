export const INJECT_DATABASE_CONFIG = Symbol('DATABASE_CONFIG');

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  databaseName: string;
}
