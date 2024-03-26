import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from "../models/user.model";
import * as petitions from "../models/petition.model";
import * as validator from "../services/validate";
import * as schemas from "../resources/schemas.json";
import * as supportTiers from '../models/petition.support_tier.model';

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`PUT add new support tier to petition ${req.params.id}`)
        const token = req.headers['x-authorization'];
        const user = await users.getOneWithToken( token );
        if(user.length === 0) {
            res.status(401).send("Unauthorized");
            return;
        }
        const validation = await validator.validate(
            schemas.support_tier_post,
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
        const petition = await petitions.getOne(parsedId);
        if (petition.length === 0) {
            res.status(404).send('No petition found with id');
            return;
        }
        if(petition[0].ownerId !== user[0].id) {
            res.status(403).send("Only the owner of a petition may change it");
            return;
        }
        if(petition[0].supportTiers.length === 3) {
            res.status(403).send("Can not add a support tier if 3 already exist");
            return;
        }
        const supportTier = {title: req.body.title, description: req.body.description, cost: req.body.cost, supportTierId: 0}
        const result = await supportTiers.addOne(supportTier, parsedId);
        res.status(201).send(`Support tier added to petition ${id}`);
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

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`PATCH update support tier ${req.params.tierId} in petition ${req.params.id}`)
        const token = req.headers['x-authorization'];
        const user = await users.getOneWithToken( token );
        if(user.length === 0) {
            res.status(401).send("Unauthorized");
            return;
        }
        const validation = await validator.validate(
            schemas.support_tier_patch,
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
        const tierId = req.params.tierId;
        const parsedTierId = parseInt(tierId, 10);
        if(isNaN(parsedTierId)) {
            res.status( 404 ).send('No support tier found with id');
            return;
        }
        const petition = await petitions.getOne(parsedId);
        if (petition.length === 0) {
            res.status(404).send('No petition found with id');
            return;
        }
        if(petition[0].ownerId !== user[0].id) {
            res.status(403).send("Only the owner of a petition may change it");
            return;
        }
        const supportTier = await supportTiers.getOne(parsedTierId, parsedId);
        if(supportTier.length === 0) {
            res.status(404).send('Support tier does not exist on petition');
            return;
        }
        const hasSupporters = await supportTiers.hasSupporters(parsedTierId);
        if(hasSupporters) {
            res.status(403).send("Can not edit a support tier if a supporter already exists for it");
            return;
        }
        if(req.body.hasOwnProperty("title")) {
            supportTier[0].title = req.body.title;
        }
        if(req.body.hasOwnProperty("description")) {
            supportTier[0].description = req.body.description;
        }
        if(req.body.hasOwnProperty("cost")) {
            supportTier[0].cost = req.body.cost;
        }
        const result = await supportTiers.updateOne(supportTier[0]);
        res.status(200).send(`Updated support tier ${tierId} in petition ${id}`);
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

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`DELETE support tier ${req.params.tierId} in petition ${req.params.id}`)
        const token = req.headers['x-authorization'];
        const user = await users.getOneWithToken( token );
        if(user.length === 0) {
            res.status(401).send("Unauthorized");
            return;
        }
        const id = req.params.id;
        const parsedId = parseInt(id, 10);
        if(isNaN(parsedId)) {
            res.status( 404 ).send('No petition found with id');
            return;
        }
        const tierId = req.params.tierId;
        const parsedTierId = parseInt(tierId, 10);
        if(isNaN(parsedTierId)) {
            res.status( 404 ).send('No support tier found with id');
            return;
        }
        const petition = await petitions.getOne(parsedId);
        if (petition.length === 0) {
            res.status(404).send('No petition found with id');
            return;
        }
        if(petition[0].ownerId !== user[0].id) {
            res.status(403).send("Only the owner of a petition may delete it");
            return;
        }
        const supportTier = await supportTiers.getOne(parsedTierId, parsedId);
        if(supportTier.length === 0) {
            res.status(404).send('Support tier does not exist on petition');
            return;
        }
        const hasSupporters = await supportTiers.hasSupporters(parsedTierId);
        if(hasSupporters) {
            res.status(403).send("Can not delete a support tier if a supporter already exists for it");
            return;
        }
        if(petition[0].supportTiers.length === 1) {
            res.status(403).send("Can not remove a support tier if it is the only one for a petition");
            return;
        }
        const result = await supportTiers.deleteOne(parsedTierId);
        res.status(200).send(`Deleted support tier ${tierId} in petition ${id}`);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {addSupportTier, editSupportTier, deleteSupportTier};