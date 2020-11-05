import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { QuillModule } from 'ngx-quill';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { EditorFieldComponent } from './editorfield/editorfield.component';
import { StarratingComponent } from './starrating/starrating.component';


@NgModule({
	declarations: [
		EditorFieldComponent,
		StarratingComponent
	],
	exports: [
   	EditorFieldComponent,
   	StarratingComponent
	],
	imports: [
		CommonModule,
		TranslateModule,
		QuillModule,
		FontAwesomeModule
	]
})
export class FieldsModule {}
