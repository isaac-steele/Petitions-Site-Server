import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const getImage = async(id: number) : Promise<string> => {
    Logger.info(`Getting image from petition ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'select image_filename from petition where id = ?';
    const [ result ] = await conn.query( query, [id]);
    await conn.release();
    return result.length === 0 ? null : result[0].image_filename;
}

const updateImage = async(fileName: string, id: number) : Promise<ResultSetHeader> => {
    Logger.info(`Update image for petition ${id} from database`);
    const conn = await getPool().getConnection();
    const query = 'update petition set image_filename = ? where id = ?'
    const [result] = await conn.query( query, [fileName, id]);
    await conn.release();
    return result;
}

export {getImage, updateImage}