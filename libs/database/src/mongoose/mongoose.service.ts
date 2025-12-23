import mongoose from 'mongoose';
import { Injectable } from '@nestjs/common';
import { DatabaseConfigService } from '@core/config';
import { DatabaseService } from '../database.interface';

@Injectable()
export class MongooseService implements DatabaseService {
  private DB: mongoose.Connection | null = null;

  constructor(private readonly databaseConfig: DatabaseConfigService) {}

  async connect(): Promise<void> {
    try {
      const uri = `mongodb://${this.databaseConfig.username}:${this.databaseConfig.password}@${this.databaseConfig.host}:${this.databaseConfig.port}/${this.databaseConfig.databaseName}?authSource=admin`;
      await mongoose.connect(uri);
      this.DB = mongoose.connection;
      console.log('[MongooseService] Connected to MongoDB');
    } catch (error) {
      console.error(
        '[MongooseService] Failed to connect to MongoDB:',
        error instanceof Error ? error.message : error,
      );
      this.DB = null;
      throw error;
    }
  }

  getDBConnection<T = mongoose.Connection>(): T {
    if (!this.DB) {
      throw new Error('Database not connected');
    }
    return this.DB as T;
  }

  async disconnect(): Promise<void> {
    if (this.DB) {
      await mongoose.disconnect();
      this.DB = null;
      console.log('[MongooseService] Disconnected from MongoDB');
    }
  }
}
