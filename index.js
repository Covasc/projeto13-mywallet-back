import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import { logIn, signIn } from "./src/controllers/authController.js";
import { getMovimentation, newMovimentation } from "./src/controllers/userController.js";


const server = express();
server.use(express.json());
server.use(cors());

dotenv.config();
const PORT = process.env.PORT;

//REQUISITIONS
server.post('/signin', signIn);
server.post("/login", logIn);
server.get('/user/movimentation', getMovimentation);
server.post('/user/movimentation', newMovimentation);

server.listen(PORT, () => {
    console.log("Server running")
});
