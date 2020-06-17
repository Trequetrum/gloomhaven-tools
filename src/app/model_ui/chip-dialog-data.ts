export class ChipDialogData {
    ChipDialogItems = new Array<ChipDialogItem>();
    constructor(public header: string, public subtext?: string){}
}

export class ChipDialogItem{
    constructor(
        public text:string, 
        public data?:any, 
        public SubMenu?:ChipDialogData) {}
}
