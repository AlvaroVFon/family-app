import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { INJECT_DATABASE } from './database.interface';
import { MongooseService } from './mongoose/mongoose.service';
import { CoreConfigModule } from '@core/config';

describe('DatabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule, CoreConfigModule],
    }).compile();
  });

  it('debe estar definido', () => {
    expect(module).toBeDefined();
  });

  it('debe registrar el provider INJECT_DATABASE', () => {
    const databaseService = module.get(INJECT_DATABASE);
    expect(databaseService).toBeDefined();
  });

  it('debe proporcionar MongooseService como implementación', () => {
    const databaseService = module.get(INJECT_DATABASE);
    expect(databaseService).toBeInstanceOf(MongooseService);
  });

  it('debe exportar INJECT_DATABASE para uso en otros módulos', () => {
    const exports = Reflect.getMetadata('exports', DatabaseModule);
    expect(exports).toContain(INJECT_DATABASE);
  });

  it('debe importar CoreConfigModule', () => {
    const imports = Reflect.getMetadata('imports', DatabaseModule);
    expect(imports).toContain(CoreConfigModule);
  });

  describe('inyección de dependencias', () => {
    it('debe permitir inyectar DatabaseService con el token', async () => {
      // Arrange
      class TestConsumer {
        constructor(public readonly db: any) {}
      }

      const testModule = await Test.createTestingModule({
        imports: [DatabaseModule, CoreConfigModule],
        providers: [
          {
            provide: TestConsumer,
            useFactory: (db: any) => new TestConsumer(db),
            inject: [INJECT_DATABASE],
          },
        ],
      }).compile();

      // Act
      const consumer = testModule.get(TestConsumer);

      // Assert
      expect(consumer).toBeDefined();
      expect(consumer.db).toBeInstanceOf(MongooseService);
    });
  });
});
