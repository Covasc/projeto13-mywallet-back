import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import joi from "joi";
import { MongoClient } from "mongodb";
import { v4 as uuid } from "uuid";


const PORT = process.env.PORT;
dotenv.config();
const server = express();
server.use(express.json());
server.use(cors());


//DB CONECTION
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db("myWallet");
})

//API

server.post('/signin', async (request, response) => {
    //SIGNIN FUNCTION

    const userData = request.body;

    async function addNewToken(tokenList) {
        const newToken = uuid();
        tokenList.push(newToken)

        return tokenList;
    }

    //USER ENTRY VALIDATION
    const credentialsSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required()
    });
    const validation = credentialsSchema.validate(userData);
    if (validation.error) {
        console.log(validation.error.details);
        //UNPROCESSABLE ENTITY
        return response.sendStatus(422);
    };
    
    try {
        //HAVE A REGISTRED ACCOUNT?
        const userRegistred = await db.collection('users').findOne({email:userData.email});

        if (userRegistred) {
            //ALREADY EXISTS
            return response.sendStatus(409);
        }
        
        //DATA ACCEPTED
        await db.collection('users').insertOne({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            token: addNewToken(userRegistred.token)
        });
        //CREATED
        response.sendStatus(201);
    } catch(error) {
        console.log(error);
        //INTERNAL SERVER ERROR
        response.sendStatus(500);
    }
});

server.post("/login", async (request, response) => {
    //LOGIN FUNCTION

    const userCredentials = request.body;

    //USER ENTRY VALIDATION
    const credentialsSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    });
    const validation = credentialsSchema.validate(userCredentials);
    if (validation.error) {
        console.log(validation.error.details);
        //UNPROCESSABLE ENTITY
        return response.sendStatus(422);
    };

    try {
        //HAVE A REGISTRED ACCOUNT?
        const userRegistred = await db.collection('users').findOne({email:userCredentials.email});

        if (!userRegistred) {
            //NOT FOUND
            return response.sendStatus(404);
        }

        //IS PASSWORD CORRECT?
        if (userCredentials.password != userRegistred.password) {
            //UNAUTHORIZED
            return response.sendStatus(401);
        }

        //ACCEPTED
        response.status(202).send({
            name: userRegistred.name,
            token: userRegistred.token
        });
    } catch(error) {
        console.log(error);
        //INTERNAL SERVER ERROR
        response.sendStatus(500);
    };
});

server.listen(PORT, () => {
    console.log("Server running")
});
