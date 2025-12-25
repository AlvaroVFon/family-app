export const INJECT_MAIL_CONFIG = Symbol('INJECT_MAIL_CONFIG');

export interface MailConfig {
  provider: string;
  port: number;
  user: string;
  password: string;
}
