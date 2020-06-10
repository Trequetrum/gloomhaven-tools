export class MenuDisplayItem {
    text: string;
    disabled: boolean;
    data: any;

    constructor(txt:string, disa?:boolean, dta?:any) { 
        this.text = txt;
        disa == null? this.disabled = false: this.disabled = disa;
        dta == null? this.data = null: this.data = dta;
    }
}
