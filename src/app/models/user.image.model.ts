import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'


const updateImage = async(fileName: string, id: number) : Promise<ResultSetHeader> => {
    Logger.info(`Update image for user ${id} from database`);
    const conn = await getPool().getConnection();
    const query = 'update user set image_filename = ? where id = ?'
    const [result] = await conn.query( query, [fileName, id]);
    await conn.release();
    return result;
}

const deleteImage = async(id: number) : Promise<ResultSetHeader> => {
    Logger.info(`Delete image for user ${id} from database`);
    const conn = await getPool().getConnection();
    const query = 'update user set image_filename = null where id = ?'
    const [result] = await conn.query( query, [id]);
    await conn.release();
    return result;
}

export {updateImage, deleteImage}