export class ChipMenuData {
    constructor(
        public header: string, 
        public subtext?: string,
        public chipMenuItems = new Array<ChipMenuItem>()){}
}

export class ChipMenuItem{
    constructor(
        public text:string, 
        public data?:any, 
        public subMenu = new Array<ChipSubmenuItem>(),
        public expanded = false) {}
}

export class ChipSubmenuItem{
    constructor(
        public text:string, 
        public data?:any){}
}