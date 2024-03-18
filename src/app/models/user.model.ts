import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'
import * as passwords from "../services/passwords";

const insert = async (email: string, firstName: string, lastName: string, password: string) : Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${firstName} ${lastName} with email ${email} to the database`);
    const conn = await getPool().getConnection();
    password = await passwords.hash(password)
    const query = 'insert into user (email, first_name, last_name, password) values ( ?, ?, ?, ? )';
    const [ result ] = await conn.query( query, [ email, firstName, lastName, password ] );
    await conn.release();
    return result;
};

const getUserByEmail = async(email: string) : Promise<User[]> => {
    Logger.info(`Getting user with email ${email} from the database`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where email = ?'
    const [result] = await conn.query( query, [email]);
    await conn.release();
    return result;
}

const createToken = async(email: string, token: string) : Promise<ResultSetHeader> => {
    Logger.info(`Adding authentication token for user with ${email} to the database`);
    const conn = await getPool().getConnection();
    const query = 'update user set auth_token = ? where email = ?'
    const [result] = await conn.query( query, [token, email]);
    await conn.release();
    return result;
}

const removeToken = async(token: string | string[]) : Promise<ResultSetHeader> => {
    Logger.info('Removing authentication token from the database');
    const conn = await getPool().getConnection();
    const query = 'update user set auth_token = null where auth_token = ?'
    const [result] = await conn.query( query, [token]);
    await conn.release();
    return result;
}

const getOneWithToken = async(id: number, token: string | string[]) : Promise<User[]> => {
    Logger.info(`Getting user ${id} with token from database`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where id = ? and auth_token = ?'
    const [result] = await conn.query( query, [id, token]);
    await conn.release();
    return result;
}

const getOneWithoutToken = async(id: number) : Promise<User[]> => {
    Logger.info(`Getting user ${id} from database`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where id = ?'
    const [result] = await conn.query( query, [id]);
    await conn.release();
    return result;
}

export {insert, createToken, getUserByEmail, removeToken, getOneWithoutToken, getOneWithToken}