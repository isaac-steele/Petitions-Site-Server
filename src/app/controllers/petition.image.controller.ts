import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petitionImages from "../models/petition.image.model";
import * as images from "../services/images";
import * as users from "../models/user.model";
import * as petitions from "../models/petition.model";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`GET retrieve image of petition ${req.params.id}`)
        const id = req.params.id;
        const parsedId = parseInt(id, 10);
        if(isNaN(parsedId)) {
            res.status( 404 ).send('No petition with id');
            return;
        }
        const fileName = await petitionImages.getImage(parsedId);
        if(fileName === null || fileName === "") {
            res.status( 404 ).send('No petition with id or petition has no image');
        } else {
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
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers['x-authorization'];
        const user = await users.getOneWithToken(token);
        if(user.length === 0) {
            res.status(401).send("Unauthorized");
            return;
        }
        Logger.http(`PUT set petition hero image ${req.params.id}`)
        const id = req.params.id;
        const parsedId = parseInt(id, 10);
        if(isNaN(parsedId)) {
            res.status( 404 ).send('No petition found with id');
            return;
        }
        const petition = await petitions.getOne(parsedId);
        if(petition.length === 0) {
            res.status(404).send('No petition found with id');
            return;
        }
        if(petition[0].ownerId !== user[0].id) {
            res.status(403).send(" Only the owner of a petition can change the hero image");
            return;
        }
        const fileType = req.headers['content-type'];
        if(!(['image/jpeg', 'image/png', 'image/gif'].includes(fileType))) {
            res.status(400).send("Bad request. Invalid image supplied");
            return;
        }
        const image = req.body;
        if(image.length === 0 || image.length === undefined) {
            res.statusMessage = 'Bad request: empty image';
            res.status(400).send();
            return;
        }
        const fileName = `petition_${id}.${fileType.replace("image/", "")}`
        const filePath = `storage/images/${fileName}`;
        const petitionImage = await petitionImages.getImage(parsedId)
        if(petitionImage !== null && petitionImage !== "") {
            await images.removeImage(petitionImage);
        }
        await images.writeImage(filePath, image);
        const updateResult = petitionImages.updateImage(fileName, parsedId);
        if(petitionImage=== null || petitionImage === "") {
            res.status(201).send("New image created");
        } else {
            res.status(200).send("Image updated");
        }
    } catch(err) {
        Logger.error(err)
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export {getImage, setImage};