import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as validator from "../services/validate";
import * as schemas from "../resources/schemas.json";
import * as petitions from "../models/petition.model";
import * as supporters from "../models/petition.supporter.model";
import * as users from "../models/user.model";
import * as supportTiers from "../models/petition.support_tier.model";


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET a list of supporters of petition ${req.params.id}`)
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('No petition with specified ID');
        return;
    }
    try{
        const result = await supporters.getAll(parsedId);
        if(result.length === 0) {
            res.status(404).send("No petition with id");
        } else {
            res.status(200).send(result);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`PUT supporting petition ${req.params.id} at tier ${req.body.supportTierId}`)
    const validation = await validator.validate(
        schemas.support_post,
        req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('No petition found with id');
        return;
    }
    const token = req.headers['x-authorization'];
    const supportTierId = parseInt(req.body.supportTierId, 10);
    const message = req.body.message;
    try{
        const user = await users.getOneWithToken( token );
        if(user.length === 0) {
            res.status(401).send("Unauthorized");
            return;
        }
        const petition = await petitions.getOne(parsedId);
        if (petition.length === 0) {
            res.status(404).send('No petition found with id');
            return;
        }
        if(petition[0].ownerId === user[0].id) {
            res.status(403).send("Cannot support your own petition");
            return;
        }
        const supportTier = await supportTiers.getOne(supportTierId, parsedId);
        if(supportTier.length === 0) {
            res.status(404).send('Support tier does not exist on petition');
            return;
        }
        const hasSupporter = await supporters.hasSupporter(user[0].id, supportTierId);
        if(hasSupporter) {
            res.status(403).send("Already supported at this tier");
            return;
        }
        const result = await supporters.createSupporter(parsedId, user[0].id, supportTierId, message);
        res.status(201).send(`Supporter added to petition ${id} at tier ${supportTierId}`);
    } catch (err) {
        Logger.error(err);
        if(err.code ===  "ER_DUP_ENTRY") {
            res.status(403).send("Support title not unique within petition")
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }


    }
}

export {getAllSupportersForPetition, addSupporter}