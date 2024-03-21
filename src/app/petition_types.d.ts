type Petitions = {

    petitionId: number,

    title: string,

    categoryId: number,

    ownerId: number,

    ownerFirstName: string,

    ownerLastName: string,

    creationDate: string,

    supportingCost: number

}

type Petition = {

    petitionId: number,

    title: string,

    categoryId: number,

    ownerId: number,

    ownerFirstName: string,

    ownerLastName: string,

    numberOfSupporters: number,

    creationDate: string,

    description: string,

    moneyRaised: number,

    supportTiers: SupportTier[]

}

type SupportTier = {

    title: string,

    description: string,

    cost: number,

    supportTierId: number
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

type Category = {

    categoryId: number,

    name: string
}

type Supporter = {

    supportId: number,

    supportTierId: number,

    message: string,

    supporterId: number,

    supporterFirstName: number,

    supporterLastName: string,

    timestamp: string
}