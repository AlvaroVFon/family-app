import { Module } from '@nestjs/common';
import { CoreConfigModule } from '@core/config';
import { MongooseService } from './mongoose/mongoose.service';
import { INJECT_DATABASE } from './database.interface';

@Module({
  imports: [CoreConfigModule],
  providers: [
    {
      provide: INJECT_DATABASE,
      useClass: MongooseService,
    },
  ],
  exports: [INJECT_DATABASE],
})
export class DatabaseModule {}
