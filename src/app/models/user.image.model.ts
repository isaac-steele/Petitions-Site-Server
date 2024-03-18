import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const getOne = async (id: number): Promise<string> => {
    Logger.info(`Getting image from user ${id} from database`);
    const conn = await getPool().getConnection();
    const query = 'select image_filename from user where id = ?'
    const [result] = await conn.query( query, [id]);
    await conn.release();
    return result;
}

export {getOne}