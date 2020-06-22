import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChipMenuData, ChipMenuItem, ChipSubmenuItem } from 'src/app/model_ui/chip-menu-data';

@Component({
  selector: 'app-select-chiplist-dialog',
  templateUrl: './select-chiplist-dialog.component.html',
  styleUrls: ['./select-chiplist-dialog.component.scss']
})
export class SelectChiplistDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<SelectChiplistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: ChipMenuData) { 
  }

  ngOnInit(): void {
  }

  onChipClick(chipData: ChipMenuItem){
    if(chipData.subMenu.length > 0){
      chipData.expanded = !chipData.expanded;
    }else{
      this.dialogRef.close(chipData.data);
    }
  }

  onChipSubClick(chipData: ChipSubmenuItem){
    this.dialogRef.close(chipData.data);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}