import { Component, OnInit } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { GloomFile } from 'src/app/model_data/gloom-file';
import { DataService } from 'src/app/service/data.service';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { Observable } from 'rxjs';
import { nullSafeIsEquivalent } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-character',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.scss']
})
export class CharacterComponent implements OnInit {

  newCharacter = true;
  docId: string;
  character: GloomFile;
  signIn$: Observable<boolean>;

  constructor(private route: ActivatedRoute,
    public authService: GoogleOauth2Service,
    public data: DataService) { 
      this.docId = "none";
    }

  ngOnInit(): void {
    this.route.queryParams.pipe(filter(params => params.doc))
      .subscribe(params => this.resolveDocId(params.doc));

    this.signIn$ = this.authService.listenSignIn();
    this.authService.listenSignIn().pipe(filter(val=>val))
      .subscribe(() => this.resolveDocId(this.docId? this.docId : "none"));
  }

  resolveDocId(docId: string){
    console.log("resolve ", docId);
    this.docId = docId;
    this.newCharacter = false;

    if(docId === "new"){
      this.newCharacter = true;
    }else if(docId === "none"){
    }else{
      this.character = this.data.getCharacterByDocId(docId);
    }

    console.log("character: ", this.getCharacter(), this.character);
  }

  reresolveDocId(){
    this.resolveDocId(this.docId);
  }

  getCharacter(): any {
    if(this.character)
      return this.character.file.getContent().Character;

    return null;
  }

  hello(): string {
    if(this.character)
      return this.character.file.getContent().Character;
    return "No Character";
  }

}
