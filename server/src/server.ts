import { app } from './app.js';
import { ENV } from './config/environment.js';
import { connectDatabase } from './config/database.js';

async function bootstrap() {
  await connectDatabase();

  app.listen(ENV.PORT, () => {
    console.log(`=======================================================`);
    console.log(`  MediCore Hospital Management API Server Running     `);
    console.log(`  Port: http://localhost:${ENV.PORT}                  `);
    console.log(`  Health Check: http://localhost:${ENV.PORT}/api/health`);
    console.log(`  Environment: ${ENV.NODE_ENV}                         `);
    console.log(`=======================================================`);
  });
}

bootstrap();
