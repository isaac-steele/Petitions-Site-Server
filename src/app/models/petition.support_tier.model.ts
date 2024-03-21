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

const getOne = async(tierId : number, id: number): Promise<SupportTier[]> => {
    Logger.info(`Getting support tier ${tierId} in petition ${id}from the database`);
    const conn = await getPool().getConnection();
    const query = 'select id as supportTierId, title, description, cost from support_tier where id = ? and petition_id = ? ';
    const [ result ] = await conn.query( query, [ tierId, id ] );
    await conn.release();
    return result;
}

const hasSupporters = async(id : number): Promise<boolean> => {
    Logger.info(`Checking if there are supporters for support tier ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'select id from supporter where support_tier_id = ? ';
    const [ result ] = await conn.query( query, [ id ] );
    await conn.release();
    return result.length > 0;
}

const updateOne = async(supportTier: SupportTier): Promise<ResultSetHeader> => {
    Logger.info(`Updating support tier ${supportTier.supportTierId} in the database`);
    const conn = await getPool().getConnection();
    const query = 'update support_tier set title = ?, description = ?, cost = ? where id = ? ';
    const [ result ] = await conn.query( query, [ supportTier.title, supportTier.description, supportTier.cost, supportTier.supportTierId ] );
    await conn.release();
    return result;
}

const deleteOne = async(id:number): Promise<ResultSetHeader> => {
    Logger.info(`Deleting support tier ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'delete from support_tier where id = ?';
    const [ result ] = await conn.query( query, [ id ] );
    await conn.release();
    return result;
}

export {addOne, getOne, hasSupporters, updateOne, deleteOne}