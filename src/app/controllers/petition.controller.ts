import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as validator from "../services/validate";
import * as schemas from "../resources/schemas.json";
import * as petitions from '../models/petition.model';

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
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
        categoryIds: Array.isArray(req.query.categoryIds) ? req.query.categoryIds.map(id => isNaN(parseInt(id as string, 10)) ? null : parseInt(id as string, 10)) : null,
        supportingCost: isNaN(parseInt(req.query.supportingCost as string, 10)) ? null : parseInt(req.query.supportingCost as string, 10),
        ownerId: isNaN(parseInt(req.query.ownerId as string, 10)) ? null : parseInt(req.query.ownerId as string, 10),
        supporterId: isNaN(parseInt(req.query.supporterId as string, 10)) ? null : parseInt(req.query.supporterId as string, 10),
        sortBy: req.query.sortBy as string || "CREATED_ASC"
    };

    try{
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
    Logger.http(`GET petition ${req.params.id}`)
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('No petition with specified ID');
        return;
    }
    try{
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
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};