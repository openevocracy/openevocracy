import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertComponent } from './alert.component';


@NgModule({
	declarations: [
		AlertComponent
	],
	exports: [
   	AlertComponent
	],
	imports: [
		CommonModule
	]
})
export class AlertModule {}
