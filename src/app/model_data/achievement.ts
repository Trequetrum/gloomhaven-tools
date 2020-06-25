export class GlobalAchievement {
    constructor(
        public name: string,
        public earned = false,
        public options?: string[],
        public selectedOption = 0
    ){}

    clone(): GlobalAchievement{
        return new GlobalAchievement(this.name, this.earned, this.options, this.selectedOption);
    }
}

export class PartyAchievement {
    constructor(
        public name: string,
        public earned = false
    ){}

    clone(): PartyAchievement{
        return new PartyAchievement(this.name, this.earned);
    }
}
