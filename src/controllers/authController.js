import joi from "joi";
import db from "../db.js";
import { v4 as uuid } from "uuid";


export async function signIn (request, response) {
    //SIGNIN FUNCTION

    const userData = request.body;

    //USER ENTRY VALIDATION
    const credentialsSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required(),
        passwordConfirm: joi.ref('password')
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
};

export async function logIn (request, response) {
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
}