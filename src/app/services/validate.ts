import Ajv from 'ajv';
const ajv = new Ajv({removeAdditional: 'all', strict: false});
ajv.addFormat("email", /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/)
ajv.addFormat("integer", /^[0-9]+$/)
const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if(!valid)
            return ajv.errorsText(validator.errors);
        return true;
    } catch (err) {
        return err.message;
    }
}

export {validate}