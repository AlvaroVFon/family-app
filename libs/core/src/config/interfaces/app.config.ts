export interface AppConfig {
  env: 'development' | 'production' | 'test';
  serviceName: string;
  port: number;
}
