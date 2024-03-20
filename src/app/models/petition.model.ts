import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const getAll = async (parameters : PetitionParameters) : Promise<Petition[]> => {
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
    orderBy += ", p.id"
    query += orderBy;
    Logger.info(query)
    const [ result ] = await conn.query( query );
    Logger.info(result);
    await conn.release();
    return result;
};

export {getAll}