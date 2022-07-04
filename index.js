import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import joi from "joi";
import dayjs from "dayjs";
import { MongoClient } from "mongodb";
import { v4 as uuid } from "uuid";


const server = express();
server.use(express.json());
server.use(cors());

dotenv.config();
const PORT = process.env.PORT;


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
            token: [],
            movimentation: []
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
    var lastToken;

    function addNewToken(tokenList) {
        const newToken = uuid();
        lastToken = newToken;
        tokenList.push(newToken);

        return tokenList;
    }

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

        //ADDING A TOKEN
        await db.collection('users').updateOne({
            email: userCredentials.email
        },{
            $set: {token: addNewToken(userRegistred.token)} 
        });

        //ACCEPTED
        response.status(202).send({
            name: userRegistred.name,
            token: lastToken
        });
    } catch(error) {
        console.log(error);
        //INTERNAL SERVER ERROR
        response.sendStatus(500);
    };
});

server.get('/user/movimentation', async (request, response) => {
    //RETURNS ALL USER'S MOVIMENTATION

    const { authorization } = request.headers;
    const token = authorization?.replace('Bearer ', '');

    //UNAUTHORIZED
    if(!token) return res.sendStatus(401);

    try {
        const object = await db.collection('users').findOne({ token: token});
        return response.status(202).send({
            name: object.name,
            movimentation: object.movimentation
        });
    } catch(error) {
        console.log(error);
        //INTERNAL SERVER ERROR
        return response.sendStatus(500);
    };
})

server.post('/user/movimentation', async (request, response) => {
    //ADDING A NEW MOVIMENTATION

    const newMovimentation = request.body;
    const { authorization } = request.headers;
    const token = authorization?.replace('Bearer ', '');

    //USER ENTRY VALIDATION
    const entrySchema = joi.object({
        value: joi.number().required(),
        text: joi.string().required(),
        type: joi.string().required()
    });
    const validation = entrySchema.validate(newMovimentation);
    if (validation.error) {
        console.log(validation.error.details);
        //UNPROCESSABLE ENTITY
        return response.sendStatus(422);
    };
    
    //UNAUTHORIZED
    if(!token) return res.sendStatus(401);

    try {
        var object = await db.collection('users').findOne({ token: token});
        newMovimentation.time = dayjs(Date.now()).format('DD/MM');
        let movimentationList = object.movimentation;
        movimentationList.push(newMovimentation);

        await db.collection('users').updateOne({
            token: token,
        },{
            $set: {movimentation: movimentationList}
        });

        return response.sendStatus(201)

    } catch(error) {
        console.log(error);
        //INTERNAL SERVER ERROR
        return response.sendStatus(500);
    }
})

server.listen(PORT, () => {
    console.log("Server running")
});
