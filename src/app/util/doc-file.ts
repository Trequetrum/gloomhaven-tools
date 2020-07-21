export class DocFile {
    constructor(
        public id?: string,
        public name?: string,
        public mimeType?: string,
        public content?: string,
        public parents?: string[]
    ){}
}
