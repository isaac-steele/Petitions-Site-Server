import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as images from '../models/user.image.model';

const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET retrieve profile image of user ${req.params.id}`)
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('Not Found. No user with specified ID');
        return;
    }
    try {
        const result = await images.getOne(parsedId);
        if(result === null) {
            res.status( 404 ).send('Not Found. No user with specified ID');
        } else {
            // get the image based on the filename
        }
    } catch (err) {
        res.status( 500 ).send( `ERROR retrieving profile image of user ${id}: ${ err }` );
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
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

const deleteImage = async (req: Request, res: Response): Promise<void> => {
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

export {getImage, setImage, deleteImage}