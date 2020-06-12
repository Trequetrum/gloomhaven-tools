import { PartyMini } from './party-mini';

export class CampaignMini {
    constructor(
        public id: number,
        public name:string, 
        public parties = new Array<PartyMini>()){}
}
