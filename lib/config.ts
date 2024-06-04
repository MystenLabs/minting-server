import { config } from 'dotenv';

config({});

export const PACKAGE_ADDRESS = process.env.PACKAGE_ADDRESS!;
export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY!;
export const ADMIN_CAP = process.env.ADMIN_CAP!;
