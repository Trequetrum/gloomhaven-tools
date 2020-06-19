export class ChipDialogData {
    constructor(
        public header: string, 
        public subtext?: string,
        public chipDialogItems = new Array<ChipDialogItem>()){}
}

export class ChipDialogItem{
    constructor(
        public text:string, 
        public data?:any, 
        public subMenu = new Array<ChipDialogSubItem>(),
        public expanded = false) {}
}

export class ChipDialogSubItem{
    constructor(
        public text:string, 
        public data?:any){}
}