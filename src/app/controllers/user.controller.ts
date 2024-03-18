import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as validator from "../services/validate";
import * as schemas from "../resources/schemas.json";
import * as users from '../models/user.model';
import crypto from "crypto";
import * as passwords from "../services/passwords";

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST registering a user with name ${req.body.firstName} ${req.body.lastName} and with email ${req.body.email}`)
    const validation = await validator.validate(
        schemas.user_register,
        req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    try {
        const result = await users.insert( email, firstName, lastName, password );
        res.status( 201 ).send({"userId": result.insertId} );

    } catch( err ) {
        if(err.code === "ER_DUP_ENTRY") {
            res.status(403).send("Email already in use")
        } else {
            res.status( 500 ).send( `ERROR registering user ${email}: ${ err }` );
        }

    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST logging in with email ${req.body.email}`)
    const validation = await validator.validate(
        schemas.user_login,
        req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const email = req.body.email;
    const password = req.body.password;
    try {
        const result = await users.getUserByEmail(email);
        if(result.length === 0) {
            res.status(401).send("UnAuthorized. Incorrect email")
        } else {
            const isValid = await passwords.compare(password, result[0].password)
            if(!isValid) {
                res.status(401).send("UnAuthorized. Incorrect password")
            } else {
                const token = crypto.randomBytes(16).toString('hex');
                const createResult = await users.createToken(email, token);
                res.status(200).send({"userId" : result[0].id, "token" : token})
            }
        }
    } catch (err) {
        res.status( 500 ).send( `ERROR logging in with ${email}: ${ err }` );
    }

}

const logout = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST logging out the currently authorised user`)
    const token = req.headers['x-authorization'];
    try{
        const result = await users.removeToken(token);
        if(result.affectedRows === 0) {
            res.status(401).send('Unauthorized. Cannot log out if you are not authenticated')
        } else {
            res.status(200).send()
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send(`Error logging out the currently authorised user: ${err}`);
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET single user id: ${req.params.id}`)
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('Not Found. No user with specified ID');
        return;
    }
    const token = req.headers['x-authorization'];
    try {
        const result = await users.getOneWithToken( parsedId, token );
        if( result.length === 0 ){
            const noTokenResult = await users.getOneWithoutToken(parsedId);
            if (noTokenResult.length === 0) {
                res.status( 404 ).send('Not Found. No user with specified ID');
            } else {
                res.status(200).send({"firstName": noTokenResult[0].first_name, "lastName" : noTokenResult[0].last_name})
            }
        } else {
            res.status( 200 ).send( {"email": result[0].email, "firstName": result[0].first_name, "lastName" : result[0].last_name} );
        }
    } catch( err ) {
        res.status( 500 ).send( `ERROR reading user ${id}: ${ err }` );
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`PATCH change user ${req.params.id}'s details`);
    const validation = await validator.validate(
        schemas.user_edit,
        req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('Not Found. No user with specified ID');
        return;
    }
    const token = req.headers['x-authorization'];
    if(token === undefined) {
        res.status(401).send("Unauthorized")
        return;
    }
    try {
        const result = await users.getOneWithToken( parsedId, token );
        if(result.length === 0) {
            const noTokenResult = await users.getOneWithoutToken(parsedId);
            if (noTokenResult.length === 0) {
                res.status(404).send('Not Found. No user with specified ID');
            } else {
                res.status(403).send("Can not edit another user's information")
            }
        } else {
            if(req.body.hasOwnProperty("password") && !req.body.hasOwnProperty("currentPassword")) {
                res.status(400).send("Invalid information")
                return;
            }
            if(!req.body.hasOwnProperty("password") && req.body.hasOwnProperty("currentPassword")) {
                res.status(400).send("Invalid information")
                return;
            }
            if(req.body.hasOwnProperty("currentPassword")) {
                const currentPassword = req.body.currentPassword;
                const isValid = await passwords.compare(currentPassword, result[0].password);
                if(!isValid) {
                    res.status(401).send("Invalid currentPassword")
                    return;
                } else {
                    const password = req.body.password;
                    if(currentPassword === password) {
                        res.status(403).send("Identical current and new passwords")
                        return;
                    } else {
                        result[0].password = await passwords.hash(password);
                    }
                }
            }
            if(req.body.hasOwnProperty("email")) {
                result[0].email = req.body.email;
            }
            if(req.body.hasOwnProperty("firstName")) {
                result[0].first_name = req.body.firstName;
            }
            if(req.body.hasOwnProperty("lastName")) {
                result[0].last_name = req.body.lastName;
            }
            const updateResult = await users.updateUser(result[0]);
            res.status(200).send(`User ${id}'s details updated`);
        }
    } catch (err) {
        Logger.error(err);
        if(err.code === "ER_DUP_ENTRY") {
            res.status(403).send("Email already in use")
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send(`Error updating user ${id}'s details: ${err}`);
        }

    }

}

export {register, login, logout, view, update}