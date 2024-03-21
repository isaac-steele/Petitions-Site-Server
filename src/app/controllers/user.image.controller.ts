import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as userImages from '../models/user.image.model';
import * as images from '../services/images';
import * as users from "../models/user.model";

const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET retrieve profile image of user ${req.params.id}`)
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('Not Found. No user with specified ID');
        return;
    }
    try {
        const result = await users.getOneWithoutToken(parsedId);
        if(result.length === 0) {
            res.status( 404 ).send('Not Found. No user with specified ID');
        } else {
            const fileName = result[0].image_filename;
            if(fileName === null) {
                res.status(404).send("User has no image");
                return;
            }
            const image = await images.readImage(fileName);
            if(fileName.endsWith("gif")) {
                res.setHeader("Content-Type", "image/gif");
            } else if(fileName.endsWith("png") || fileName.endsWith("PNG")) {
                res.setHeader("Content-Type", "image/png");
            } else if(fileName.endsWith("jpg") || fileName.endsWith("jpeg")) {
                res.setHeader("Content-Type", "image/jpeg");
            }
            res.status(200).send(image);
        }
    } catch (err) {
        res.status( 500 ).send( `ERROR retrieving profile image of user ${id}: ${ err }` );
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`PUT set profile image of user ${req.params.id}`)
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('Not Found. No user with specified ID');
        return;
    }
    const token = req.headers['x-authorization'];
    const fileType = req.headers['content-type'];
    if(!(['image/jpeg', 'image/png', 'image/gif'].includes(fileType))) {
        res.status(400).send("Bad request. Invalid image supplied");
        return;
    }
    const image = req.body;
    try {
        const result = await users.getOneWithToken(token);
        const user = await users.getOneWithoutToken(parsedId);
        if(result.length === 0) {
            res.status(401).send("Unauthorized");
        } else if(user.length === 0) {
            res.status(404).send('Not Found. No user with specified ID');
        } else if(result[0].id !== user[0].id) {
            res.status(403).send("Can not change another user's profile photo");
        } else {
            const fileName = `user_${id}.${fileType.replace("image/", "")}`
            const filePath = `storage/images/${fileName}`;
            await images.writeImage(filePath, image);
            const updateResult = userImages.updateImage(fileName, parsedId);
            if(result[0].image_filename === null) {
                res.status(201).send("New image created");
            } else {
                res.status(200).send("Image updated");
            }
        }
    } catch(err) {
        res.status( 500 ).send( `ERROR updating profile image of user ${id}: ${ err }` );
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`DELETE profile image of user ${req.params.id}`)
    const id = req.params.id;
    const parsedId = parseInt(id, 10);
    if(isNaN(parsedId)) {
        res.status( 404 ).send('Not Found. No user with specified ID');
        return;
    }
    const token = req.headers['x-authorization'];
    try {
        const result = await users.getOneWithToken(token);
        const user = await users.getOneWithoutToken(parsedId);
        if(result.length === 0) {
            res.status(401).send("Unauthorized");
        } else if(user.length === 0) {
            res.status(404).send('Not Found. No user with specified ID');
        } else if(result[0].id !== user[0].id) {
            res.status(403).send("Can not delete another user's profile photo");
        } else {
            const deleteResult = await userImages.deleteImage(parsedId);
            res.status(200).send("Image deleted");
        }
    } catch (err) {
        res.status( 500 ).send( `ERROR deleting profile image of user ${id}: ${ err }` );
    }
}

export {getImage, setImage, deleteImage}