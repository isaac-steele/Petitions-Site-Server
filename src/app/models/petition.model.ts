import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'


const getAll = async (parameters : PetitionParameters) : Promise<Petitions[]> => {
    Logger.info(`Getting petitions from the database`);
    const conn = await getPool().getConnection();
    const conditions = [];
    let query = 'select p.id as petitionId, p.title, p.category_id as categoryId, p.owner_id as ownerId,' +
        ' u.first_name as ownerFirstName, u.last_name as ownerLastName, p.creation_date as creationDate,' +
        ' (SELECT MIN(cost) FROM support_tier WHERE petition_id = p.id) as supportingCost' +
        ' from petition p join user u on p.owner_id = u.id';
    if(parameters.q != null) {
        conditions.push(`(p.title like '%${parameters.q}%' or p.description like '%${parameters.q}%')`);
    }
    if(parameters.categoryIds != null) {
        const categoryConditions = parameters.categoryIds.map(id => `category_id = ${id}`).join(' OR ');
        conditions.push(`(${categoryConditions})`);
    }
    if(parameters.supportingCost != null) {
        conditions.push(`EXISTS (SELECT * FROM support_tier WHERE petition_id = p.id AND  cost <= ${parameters.supportingCost})`);
    }
    if(parameters.supporterId != null) {
        conditions.push(`EXISTS (SELECT * FROM supporter WHERE petition_id = p.id AND user_id = ${parameters.supporterId})`)
    }
    if (parameters.ownerId !== null) {
        conditions.push(`p.owner_id = ${parameters.ownerId}`);
    }
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ` GROUP BY p.id`
    let orderBy = " ORDER BY ";
    switch(parameters.sortBy) {
        case "ALPHABETICAL_ASC":
            orderBy += "p.title";
            break;
        case "ALPHABETICAL_DESC":
            orderBy += "p.title DESC";
            break;
        case "COST_ASC":
            orderBy += "(SELECT MIN(cost) FROM support_tier WHERE petition_id = p.id)";
            break;
        case "COST_DESC":
            orderBy += "(SELECT MIN(cost) FROM support_tier WHERE petition_id = p.id) DESC";
            break;
        case "CREATED_ASC":
            orderBy += "p.creation_date";
            break;
        case "CREATED_DESC":
            orderBy += "p.creation_date DESC";
            break;
    }
    orderBy += ", p.id";
    query += orderBy;
    const [ result ] = await conn.query( query );
    await conn.release();
    return result;
};

const getOne = async(id: number) : Promise<Petition[]> => {
    Logger.info(`Getting petition ${id} from the database`);
    const conn = await getPool().getConnection();
    const petitionQuery = 'select p.id as petitionId, p.title, p.category_id as categoryId, p.owner_id as ownerId,' +
        ' u.first_name as ownerFirstName, u.last_name as ownerLastName,' +
        ' (SELECT COUNT(id) from supporter where petition_id = p.id) as numberOfSupporters, p.creation_date as creationDate,' +
        ` p.description from petition p join user u on p.owner_id = u.id where p.id = ${id}`;
    const [ result ] = await conn.query( petitionQuery);
    if(result.length === 0) {
        return result;
    }
    const supportTiersQuery = 'select title, description, cost, id as supportTierId from support_tier' +
        ` where petition_id = ${id}`;
    const [ supportTiers ] = await conn.query( supportTiersQuery);
    const supportQuery = 'select support_tier_id as supportTierId from supporter where petition_id = ?';
    const [supporters] = await conn.query(supportQuery, [id]);
    let money = 0;
    supporters.forEach( (supporter: { supportTierId: number}) => {
        (supportTiers as SupportTier[]).forEach(tier => {
            if (tier.supportTierId === supporter.supportTierId) {
                money += tier.cost;
            }
        } )
    })
    result[0].moneyRaised = money;
    result[0].supportTiers = supportTiers;
    await conn.release();
    return result;
}

const addOne = async(title: string, description: string, categoryId: number, ownerId: number): Promise<ResultSetHeader> => {
    Logger.info(`Adding petition ${title} to the database`);
    const conn = await getPool().getConnection();
    const d = new Date();
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = d.getHours()
    const minute = d.getMinutes()
    const second = d.getSeconds()
    const creationDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`
    const query = 'insert into petition (title, description, category_id, creation_date, owner_id) values ( ?, ?, ?, ?, ? )';
    const [ result ] = await conn.query( query, [ title, description, categoryId, creationDate, ownerId ] );
    await conn.release();
    return result;
}

const updateOne = async(petition: Petition) : Promise<ResultSetHeader> => {
    Logger.info(`Updating petition ${petition.petitionId} in the database`);
    const conn = await getPool().getConnection();
    const query = 'update petition set title = ?, description = ?, category_id = ? where id = ?';
    const [ result ] = await conn.query( query, [ petition.title, petition.description, petition.categoryId, petition.petitionId ] );
    await conn.release();
    return result;
}

const deleteOne = async(id : number) : Promise<ResultSetHeader> => {
    Logger.info(`Deleting petition ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'delete from petition where id = ?';
    const [ result ] = await conn.query( query, [ id ] );
    await conn.release();
    return result;
}

const getCategories = async() : Promise<Category[]> => {
    Logger.info(`Getting petitions from the database`);
    const conn = await getPool().getConnection();
    const query = 'select id as categoryId, name from category';
    const [ result ] = await conn.query( query );
    await conn.release();
    return result;
}

export {getAll, getOne, addOne, updateOne, deleteOne, getCategories}