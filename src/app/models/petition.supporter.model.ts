import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const getAll = async(id : number): Promise<Supporter[]> => {
    Logger.info(`Getting supporters of petition ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'select supporter.id as supportId, support_tier_id as supportTierId, message, user_id as supporterId,' +
        ' user.first_name as supporterFirstName, user.last_name as supporterLastName, timestamp from supporter,' +
        ' user where petition_id = ? and user_id = user.id order by timestamp desc';
    const [ result ] = await conn.query( query, [ id ] );
    await conn.release();
    return result;
}

const hasSupporter = async(supporterId: number, tierId: number): Promise<boolean> => {
    Logger.info(`Checking if supporter ${supporterId} supports tier ${tierId} from the database`);
    const conn = await getPool().getConnection();
    const query = 'select id from supporter where support_tier_id = ? and user_id = ?';
    const [ result ] = await conn.query( query, [ tierId, supporterId ] );
    await conn.release();
    return result.length > 0;
}

const createSupporter = async(petitionId: number, userId: number, tierId : number, message: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding supporter ${userId} to petition ${petitionId} at tier ${tierId} to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into supporter (petition_id, support_tier_id, user_id, message) values (?,?,?,?)';
    const [ result ] = await conn.query( query, [ petitionId, tierId, userId, message ] );
    await conn.release();
    return result;
}

export {getAll, hasSupporter, createSupporter}