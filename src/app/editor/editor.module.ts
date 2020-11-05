import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Components
import { EditorComponent } from './editor.component';

// Modules
import { QuillModule } from 'ngx-quill';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialsModule } from '../materials/materials.module';


@NgModule({
	declarations: [
		EditorComponent
	],
	imports: [
		CommonModule,
		TranslateModule,
		MaterialsModule,
		FontAwesomeModule,
		QuillModule.forRoot(),
	]
})
export class EditorModule {}
