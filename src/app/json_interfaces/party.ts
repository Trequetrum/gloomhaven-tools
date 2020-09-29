export interface Party {
	"name": string,
	"reputation": number,
	"location": string,
	"partyAchievements": string[],
	"members": PartyMembers[],
	"events": PartyEvent[]
}

export interface PartyMembers {
	"name": string,
	"class": string,
	"retired": boolean,
	"docId": string
}

export interface PartyEvent {
	"date": string,
	"type": "city" | "road" | "rift",
	"drawCard": number,
	"choice": "a" | "b",
	"action": "bottom" | "remove"
}
