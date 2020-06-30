export class GlobalAchievement {
    constructor(
        public name: string,
        public earned = false,
        public options?: string[],
        public selectedOption = 0
    ){}

    clone(): GlobalAchievement{
        return Object.assign({}, this);
    }
}

export class PartyAchievement {
    constructor(
        public name: string,
        public earned = false
    ){}

    clone(): PartyAchievement{
        return Object.assign({}, this);
    }
}
