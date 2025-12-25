import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CoreConfigModule, MailConfigService } from '@core';
import { MailModule } from './mail.module';
import { MailService } from './mail.service';

describe('MailModule Integration', () => {
  let module: TestingModule;
  let mailService: MailService;
  let mailConfigService: MailConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), CoreConfigModule, MailModule],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailConfigService = module.get<MailConfigService>(MailConfigService);
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide MailService', () => {
    expect(mailService).toBeDefined();
  });

  it('should provide MailConfigService from CoreConfigModule', () => {
    expect(mailConfigService).toBeDefined();
  });

  it('should be able to access mail configuration', () => {
    expect(mailConfigService.provider).toBeDefined();
    expect(mailConfigService.port).toBeDefined();
    expect(mailConfigService.user).toBeDefined();
    expect(mailConfigService.password).toBeDefined();
  });
});
