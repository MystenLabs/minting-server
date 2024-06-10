import { config } from 'dotenv';

config({});

function validateEnvVariables() {
  const requiredEnvVars = {
    PACKAGE_ADDRESS: process.env.PACKAGE_ADDRESS,
    ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
    ADMIN_CAP: process.env.ADMIN_CAP,
    ADMIN_ADDRESS: process.env.ADMIN_ADDRESS
  };

  const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => value === undefined || value === '')
    .map(([key]) => key);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `The following required environment variables are missing: ${missingEnvVars.join(', ')}`
    );
  }
}

// Validate environment variables before exporting them
validateEnvVariables();

export const PACKAGE_ADDRESS = process.env.PACKAGE_ADDRESS!;
export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY!;
export const ADMIN_CAP = process.env.ADMIN_CAP!;
export const ADMIN_ADRESS = process.env.ADMIN_ADDRESS!;
