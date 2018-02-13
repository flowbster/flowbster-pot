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
  MatProgressSpinnerModule,
  MatTabsModule,
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
    MatProgressSpinnerModule,
    MatTabsModule,
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
    MatProgressSpinnerModule,
    MatTabsModule,
  ]
})
export class MaterialModule {}
