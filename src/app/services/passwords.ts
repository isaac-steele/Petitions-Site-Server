import bcrypt from "bcryptjs"

const hash = async (password: string): Promise<string> => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    const samePasswords = await bcrypt.compare(password, comp);
    return samePasswords;
}

export {hash, compare}