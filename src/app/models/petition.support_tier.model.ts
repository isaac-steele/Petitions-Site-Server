import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const addOne = async(supportTier: SupportTier, petitionId: number): Promise<ResultSetHeader> => {
    Logger.info(`Adding support tier ${supportTier.title} to petition ${petitionId} to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into support_tier (title, description, cost, petition_id) values ( ?, ?, ?, ?)';
    const [ result ] = await conn.query( query, [ supportTier.title, supportTier.description, supportTier.cost, petitionId ] );
    await conn.release();
    return result;
}

export {addOne}