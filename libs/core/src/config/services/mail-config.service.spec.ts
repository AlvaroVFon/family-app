import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailConfigService } from './mail-config.service';

describe('MailConfigService', () => {
  let service: MailConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                MAIL_PROVIDER: 'smtp',
                MAIL_PORT: 587,
                MAIL_USER: 'test@example.com',
                MAIL_PASSWORD: 'test-password',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailConfigService>(MailConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return mail provider', () => {
    expect(service.provider).toBe('smtp');
  });

  it('should return mail port', () => {
    expect(service.port).toBe(587);
  });

  it('should return mail user', () => {
    expect(service.user).toBe('test@example.com');
  });

  it('should return mail password', () => {
    expect(service.password).toBe('test-password');
  });

  it('should use default values when environment variables are not set', () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => defaultValue),
    };

    const testService = new MailConfigService(
      mockConfigService as any as ConfigService,
    );

    expect(testService.provider).toBe('smtp');
    expect(testService.port).toBe(587);
    expect(testService.user).toBe('user@example.com');
    expect(testService.password).toBe('password');
  });
});
