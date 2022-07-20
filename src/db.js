import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;

//DB CONECTION
const mongoClient = new MongoClient(process.env.MONGO_URI);
await mongoClient.connect();
const db = mongoClient.db("myWallet");

export default db;