import { Component, OnInit } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DataService } from 'src/app/service/data.service';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { Observable, Subscription } from 'rxjs';
import { CharacterFile } from 'src/app/model_data/character-file';
import { FileAlertAction } from 'src/app/service/google-file-manager.service';

@Component({
    selector: 'app-character',
    templateUrl: './character.component.html',
    styleUrls: ['./character.component.scss']
})
export class CharacterComponent implements OnInit {

    newCharacter = true;
    docId: string;
    characterFile: CharacterFile;
    CharacterFile$: Observable<{ action: FileAlertAction, file: CharacterFile }>;
    CharacterFile$Sub: Subscription;
    signIn$: Observable<boolean>;

    constructor(private route: ActivatedRoute,
        public authService: GoogleOauth2Service,
        public data: DataService) {
        this.docId = "none";
    }

    ngOnInit(): void {
        // Listen to query parameters to know which character to load
        this.route.queryParams.pipe(filter(params => params.doc))
            .subscribe(params => this.resolveDocId(params.doc));

        // Track sign-in state. 
        this.signIn$ = this.authService.listenSignIn();

        // If our character isn't loaded yet, we can look to new files
        // as a possible source
        /*
        const sub = this.data.listenCharactersFiles().subscribe(()=>{
          if(!this.characterFile && !this.newCharacter){
            this.resolveDocId(this.docId);
          }else{
            sub.unsubscribe();
          }
        });
        */
    }

    resolveDocId(docId: string) {
        this.docId = docId;
        this.newCharacter = false;
        if (docId === "new") {
            this.newCharacter = true;
        } else {
            // this.characterFile = this.data.getCharacterFileByDocId(docId);
            if (this.CharacterFile$Sub) this.CharacterFile$Sub.unsubscribe();
            
            this.CharacterFile$ = this.data.listenCharacterFileByDocId(docId);

            this.CharacterFile$Sub = this.CharacterFile$.subscribe(({ action, file }) => {
                console.log("Checking out subscription logic: ", { action, file });
                if(action === "update" || action === "load"){
                    this.characterFile = file;
                }else{
                    this.characterFile = null;
                }

            });
        }
        console.log("character: ", this.characterFile);
    }
}
