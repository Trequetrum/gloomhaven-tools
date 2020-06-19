export class GlobalAchievement {
    constructor(
        public name: string,
        public earned = false,
        public options?: string[],
        public selectedOption = 0
    ){}
}

export class PartyAchievement {
    constructor(
        public name: string,
        public earned = false
    ){}
}
