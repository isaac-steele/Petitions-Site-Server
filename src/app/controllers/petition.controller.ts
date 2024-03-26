import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as validator from "../services/validate";
import * as schemas from "../resources/schemas.json";
import * as petitions from '../models/petition.model';
import * as supportTiers from '../models/petition.support_tier.model';
import * as users from '../models/user.model';

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`GET a list of petitions`)
        const validation = await validator.validate(
            schemas.petition_search,
            req.query);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const petitionParams: PetitionParameters = {
            startIndex: isNaN(parseInt(req.query.startIndex as string, 10)) ? null : parseInt(req.query.startIndex as string, 10),
            count: isNaN(parseInt(req.query.count as string, 10)) ? null : parseInt(req.query.count as string, 10),
            q: req.query.q as string || null,
            categoryIds: [],
            supportingCost: isNaN(parseInt(req.query.supportingCost as string, 10)) ? null : parseInt(req.query.supportingCost as string, 10),
            ownerId: isNaN(parseInt(req.query.ownerId as string, 10)) ? null : parseInt(req.query.ownerId as string, 10),
            supporterId: isNaN(parseInt(req.query.supporterId as string, 10)) ? null : parseInt(req.query.supporterId as string, 10),
            sortBy: req.query.sortBy as string || "CREATED_ASC"
        };
        if (Array.isArray(req.query.categoryIds)) {
            petitionParams.categoryIds = req.query.categoryIds.map(id => isNaN(parseInt(id as string, 10)) ? null : parseInt(id as string, 10));
        } else if (typeof req.query.categoryIds === 'string') {
            const id = req.query.categoryIds;
            petitionParams.categoryIds = isNaN(parseInt(id, 10)) ? null : [parseInt(id, 10)];
        } else {
            petitionParams.categoryIds = null;
        }
        const result = await petitions.getAll(petitionParams);
        const count = result.length;
        let filteredResults = result;
        if(petitionParams.startIndex != null) {
            filteredResults = result.slice(petitionParams.startIndex);
        }
        if(petitionParams.count != null) {
            filteredResults =result.slice(0, petitionParams.count)
        }
        res.status(200).send({"petitions" : filteredResults, "count": count})
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`GET petition ${req.params.id}`)
        const id = req.params.id;
        const parsedId = parseInt(id, 10);
        if(isNaN(parsedId)) {
            res.status( 404 ).send('No petition with specified ID');
            return;
        }
        const result = await petitions.getOne(parsedId);
        if(result.length === 0) {
            res.status(404).send('No petition with specified id');
        } else {
            res.status(200).send(result[0]);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`POST add new petition ${req.body.title}`)
        const token = req.headers['x-authorization'];
        const user = await users.getOneWithToken(token);
        if(user.length === 0) {
            res.status(401).send('Unauthorized');
            return;
        }
        const validation = await validator.validate(
            schemas.petition_post,
            req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const title = req.body.title;
        const description = req.body.description;
        const categoryId = req.body.categoryId;
        const supportTierList = req.body.supportTiers as SupportTier[];
        const supportTierTitles = [];
        for (const supportTier of supportTierList) {
            supportTierTitles.push(supportTier.title);
        }
        if(!(supportTierTitles.length === new Set(supportTierTitles).size)) {
            res.status(400).send("The support tier titles must be unique");
            return;
        }
        const result = await petitions.addOne(title, description, categoryId, user[0].id);
        const id = result.insertId;
        for (const supportTier of supportTierList) {
            const supportResult = await supportTiers.addOne(supportTier, id);
        }
        res.status(201).send({"petitionId": id})
    } catch (err) {
        Logger.error(err);
        if(err.errno === 1216 || err.errno === 1452) {
            res.status(400).send("Category does not exist")
        } else if(err.code === "ER_DUP_ENTRY") {
            res.status(403).send("Petition title already exists")
        }
        else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }

    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`PATCH update existing petition ${req.params.id}`)
        const token = req.headers['x-authorization'];
        const user = await users.getOneWithToken( token );
        if(user.length === 0) {
            res.status(401).send("Unauthorized");
            return;
        }
        const validation = await validator.validate(
            schemas.petition_patch,
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
            res.status(404).send('No petition with id');
            return;
        }
        if(petition[0].ownerId !== user[0].id) {
            res.status(403).send("Only the owner of a petition may change it");
            return;
        }
        if(req.body.hasOwnProperty("title")) {
            petition[0].title = req.body.title;
        }
        if(req.body.hasOwnProperty("description")) {
            petition[0].description = req.body.description;
        }
        if(req.body.hasOwnProperty("categoryId")) {
            petition[0].categoryId = req.body.categoryId;
        }
        const result = await petitions.updateOne(petition[0]);
        res.status(200).send(`Petition ${id}'s details updated`);
    } catch (err) {
        Logger.error(err);
        if(err.errno === 1216 || err.errno === 1452) {
            res.status(400).send("Category does not exist")
        } else if(err.code === "ER_DUP_ENTRY") {
            res.status(403).send("Petition title already exists")
        }
        else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`DELETE delete petition ${req.params.id}`)
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
        const petition = await petitions.getOne(parsedId);
        if (petition.length === 0) {
            res.status(404).send('No petition found with id');
            return;
        }
        if(petition[0].ownerId !== user[0].id) {
            res.status(403).send("Only the owner of a petition may delete it");
            return;
        }
        if(petition[0].numberOfSupporters > 0) {
            res.status(403).send("Can not delete a petition with one or more supporters");
            return;
        }
        const result = await petitions.deleteOne(parsedId);
        res.status(200).send(`Petition ${id} deleted`);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;

    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`GET all petition categories`)
        const result = await petitions.getCategories();
        res.status(200).send(result);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};