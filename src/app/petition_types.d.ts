type Petition = {

    id: number,

    title: string,

    description: string,

    creation_date: string,

    image_filename: string,

    owner_id: number,

    category_id: number
}

type PetitionParameters = {

    startIndex : number,

    count: number,

    q: string,

    categoryIds: number[],

    supportingCost: number,

    ownerId: number,

    supporterId: number,

    sortBy : string
}