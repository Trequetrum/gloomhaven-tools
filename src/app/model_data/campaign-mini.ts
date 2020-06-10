import { PartyMini } from './party-mini';

export class CampaignMini {
    constructor(
        public id: number,
        public uriPath:string, 
        public name:string, 
        public parties = new Array<PartyMini>()){}
}
