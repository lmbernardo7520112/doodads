import { config } from 'dotenv';
import { connectToMongo } from './config/db.ts';

config();  // Carrega o .env
connectToMongo();
console.log("Script executado com sucesso!");