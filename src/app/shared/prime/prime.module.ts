import { NgModule } from '@angular/core';

import {
  MenuModule,
  DialogModule,
  GrowlModule,
  DropdownModule,
  PanelModule,
  InputTextModule,
  ButtonModule,
  FileUploadModule,
  TabViewModule,
  CodeHighlighterModule,
  DataTableModule,
  SharedModule,
  ContextMenuModule,
  ConfirmDialogModule,
  DataListModule,
  TooltipModule,
  ProgressBarModule
} from 'primeng/primeng';

@NgModule({
  imports: [
    MenuModule,
    DialogModule,
    GrowlModule,
    DropdownModule,
    PanelModule,
    InputTextModule,
    ButtonModule,
    FileUploadModule,
    TabViewModule,
    CodeHighlighterModule,
    DataTableModule,
    SharedModule,
    ContextMenuModule,
    ConfirmDialogModule,
    DataListModule,
    TooltipModule,
    ProgressBarModule
  ],
  exports: [
    MenuModule,
    DialogModule,
    GrowlModule,
    DropdownModule,
    PanelModule,
    InputTextModule,
    ButtonModule,
    FileUploadModule,
    TabViewModule,
    CodeHighlighterModule,
    DataTableModule,
    SharedModule,
    ContextMenuModule,
    ConfirmDialogModule,
    DataListModule,
    TooltipModule,
    ProgressBarModule
  ]
})
export class PrimeModule {}
