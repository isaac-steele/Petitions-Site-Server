import fs from 'mz/fs';

const readImage = async(fileName: string): Promise<Buffer> => {
    const filePath = `storage/images/${fileName}`
    const imageData = await fs.readFile(filePath);
    return imageData;
}

const writeImage = async(filePath: string, imageData: Buffer): Promise<void> => {
    await fs.writeFile(filePath, imageData);
}

export {readImage, writeImage}