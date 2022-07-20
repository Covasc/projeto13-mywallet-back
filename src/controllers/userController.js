import db from "../db.js";
import joi from "joi";
import dayjs from "dayjs";

export async function getMovimentation (request, response) {
    //RETURNS ALL USER'S MOVIMENTATION

    const { authorization } = request.headers;
    const token = authorization?.replace('Bearer ', '');

    //UNAUTHORIZED
    if(!token) return res.sendStatus(401);

    try {
        const object = await db.collection('users').findOne({token: token});
        return response.status(202).send({
            name: object.name,
            movimentation: object.movimentation
        });
    } catch(error) {
        console.log(error);
        //INTERNAL SERVER ERROR
        return response.sendStatus(500);
    };
}

export async function newMovimentation (request, response) {
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
}

