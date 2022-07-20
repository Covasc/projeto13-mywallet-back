import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;
let db;

//DB CONECTION
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect().then(() => {
    db = mongoClient.db("myWallet");
})

export default db;