import { NgModule } from '@angular/core';

import { CountdownComponent } from './countdown.component';


@NgModule({
	declarations: [
		CountdownComponent
	],
	exports: [
   	CountdownComponent
	]
})
export class CountdownModule {}
