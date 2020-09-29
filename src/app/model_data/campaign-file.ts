import { Character } from '../json_interfaces/character';
import { GloomFile } from './gloom-file';

export class CampaignFile extends GloomFile {

	constructor(file: GloomFile) {
		super(file);
		if (!this.isCampaign) {
			this.content.Campaign = {
				error: {
					type: "Casting",
					message: "Drive document " + file.id + " does not contain a Gloomhaven Campaign",
				}
			};
		}
	}

	get campaign(): Character {
		return this.content.Campaign;
	}
}
