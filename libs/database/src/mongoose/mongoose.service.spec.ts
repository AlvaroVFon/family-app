import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { MongooseService } from './mongoose.service';
import { DatabaseConfigService } from '@core/config';

jest.mock('mongoose');

describe('MongooseService', () => {
  let service: MongooseService;
  let mockDatabaseConfig: jest.Mocked<DatabaseConfigService>;
  let mockConnection: Partial<mongoose.Connection>;

  beforeEach(async () => {
    // Mock de DatabaseConfigService
    mockDatabaseConfig = {
      host: 'localhost',
      port: 27017,
      username: 'testuser',
      password: 'testpass',
      databaseName: 'testdb',
    } as jest.Mocked<DatabaseConfigService>;

    // Mock de mongoose.connection
    mockConnection = {
      readyState: 1,
    } as Partial<mongoose.Connection>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongooseService,
        {
          provide: DatabaseConfigService,
          useValue: mockDatabaseConfig,
        },
      ],
    }).compile();

    service = module.get<MongooseService>(MongooseService);

    // Reset mocks antes de cada test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('connect', () => {
    it('debe conectar exitosamente a MongoDB', async () => {
      // Arrange
      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockResolvedValue(mongoose as any);
      Object.defineProperty(mongoose, 'connection', {
        get: () => mockConnection,
        configurable: true,
      });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.connect();

      // Assert
      expect(connectSpy).toHaveBeenCalledWith(
        'mongodb://testuser:testpass@localhost:27017/testdb?authSource=admin',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MongooseService] Connected to MongoDB',
      );
    });

    it('debe construir la URI correctamente con configuración', async () => {
      // Arrange
      mockDatabaseConfig.host = 'mongo.example.com';
      mockDatabaseConfig.port = 27018;
      mockDatabaseConfig.username = 'admin';
      mockDatabaseConfig.password = 'secret123';
      mockDatabaseConfig.databaseName = 'production';

      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockResolvedValue(mongoose as any);
      Object.defineProperty(mongoose, 'connection', {
        get: () => mockConnection,
        configurable: true,
      });

      // Act
      await service.connect();

      // Assert
      expect(connectSpy).toHaveBeenCalledWith(
        'mongodb://admin:secret123@mongo.example.com:27018/production?authSource=admin',
      );
    });

    it('debe manejar errores de conexión y loggearlos', async () => {
      // Arrange
      const connectionError = new Error('Connection refused');
      jest.spyOn(mongoose, 'connect').mockRejectedValue(connectionError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(service.connect()).rejects.toThrow('Connection refused');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[MongooseService] Failed to connect to MongoDB:',
        'Connection refused',
      );
    });

    it('debe establecer DB a null cuando falla la conexión', async () => {
      // Arrange
      jest
        .spyOn(mongoose, 'connect')
        .mockRejectedValue(new Error('Network error'));
      jest.spyOn(console, 'error').mockImplementation();

      // Act
      try {
        await service.connect();
      } catch (error) {
        // Expected
      }

      // Assert
      expect(() => service.getDBConnection()).toThrow('Database not connected');
    });
  });

  describe('getDBConnection', () => {
    it('debe retornar la conexión cuando está conectada', async () => {
      // Arrange
      jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
      Object.defineProperty(mongoose, 'connection', {
        get: () => mockConnection,
        configurable: true,
      });
      jest.spyOn(console, 'log').mockImplementation();

      await service.connect();

      // Act
      const connection = service.getDBConnection();

      // Assert
      expect(connection).toBeDefined();
      expect(connection).toBe(mockConnection);
    });

    it('debe lanzar error si no hay conexión establecida', () => {
      // Act & Assert
      expect(() => service.getDBConnection()).toThrow('Database not connected');
    });

    it('debe retornar la conexión con el tipo genérico correcto', async () => {
      // Arrange
      jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
      Object.defineProperty(mongoose, 'connection', {
        get: () => mockConnection,
        configurable: true,
      });
      jest.spyOn(console, 'log').mockImplementation();

      await service.connect();

      // Act
      const connection = service.getDBConnection<mongoose.Connection>();

      // Assert
      expect(connection).toBe(mockConnection);
    });
  });

  describe('disconnect', () => {
    it('debe desconectar cuando hay conexión activa', async () => {
      // Arrange
      jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
      Object.defineProperty(mongoose, 'connection', {
        get: () => mockConnection,
        configurable: true,
      });
      const disconnectSpy = jest
        .spyOn(mongoose, 'disconnect')
        .mockResolvedValue();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.connect();

      // Act
      await service.disconnect();

      // Assert
      expect(disconnectSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MongooseService] Disconnected from MongoDB',
      );
      expect(() => service.getDBConnection()).toThrow('Database not connected');
    });

    it('no debe hacer nada si no hay conexión activa', async () => {
      // Arrange
      const disconnectSpy = jest
        .spyOn(mongoose, 'disconnect')
        .mockResolvedValue();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.disconnect();

      // Assert
      expect(disconnectSpy).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalledWith(
        '[MongooseService] Disconnected from MongoDB',
      );
    });

    it('debe permitir reconectar después de desconectar', async () => {
      // Arrange
      jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
      Object.defineProperty(mongoose, 'connection', {
        get: () => mockConnection,
        configurable: true,
      });
      jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
      jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.connect();
      await service.disconnect();
      await service.connect();

      // Assert
      const connection = service.getDBConnection();
      expect(connection).toBeDefined();
    });
  });

  describe('ciclo de vida completo', () => {
    it('debe manejar ciclo completo: conectar -> usar -> desconectar', async () => {
      // Arrange
      jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
      Object.defineProperty(mongoose, 'connection', {
        get: () => mockConnection,
        configurable: true,
      });
      jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
      jest.spyOn(console, 'log').mockImplementation();

      // Act & Assert
      await service.connect();
      expect(service.getDBConnection()).toBeDefined();

      await service.disconnect();
      expect(() => service.getDBConnection()).toThrow('Database not connected');
    });
  });
});
