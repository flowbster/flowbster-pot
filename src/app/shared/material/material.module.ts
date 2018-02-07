import { NgModule } from '@angular/core';

import {
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatInputModule,
  MatCheckboxModule,
  MatButtonModule,
  MatTooltipModule,
  MatSelectModule,
  MatSliderModule,
  MatListModule,
  MatExpansionModule,
  MatProgressSpinnerModule
} from '@angular/material';

@NgModule({
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatSliderModule,
    MatListModule,
    MatExpansionModule,
    MatProgressSpinnerModule
  ],
  exports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatSliderModule,
    MatListModule,
    MatExpansionModule,
    MatProgressSpinnerModule
  ]
})
export class MaterialModule {}
