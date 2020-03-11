import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class LineNumbersService {

	constructor() { }
	
	/**
	 * @desc: Calculate and show line numbers
	 */
	public getLineNumbers() {
    
		// Get element with class
		const editor = document.getElementsByClassName("ql-editor")[0];
		
		// Get childs of text
		const childs = editor.childNodes;
		
		// Get parent of editor
		const container = editor.parentNode;
		
		// Create numbering div and add it to parent container
		const numbering = document.createElement("div");
		numbering.setAttribute("class", "ql-numbering");
		container.appendChild(numbering);
		
		// Iterate over all editor children
		//let i = 1;
		childs.forEach((child: HTMLElement, index) => {
			const i = index+1;
			// If child is of allowed type, add line number
			//if (['P','H1','H2','UL','OL'].indexOf(child.nodeName) !== -1) {
				// Define some shift options for a better look
				const shiftTop = 0;
				const shiftLeft = (i < 10) ? 30 : (i < 100) ? 35 : 0;
				
				// Create span element, define styles and add it to numbering container
				const span = document.createElement("span");
				span.innerText = String(i);
				span.style.top = (child.offsetTop + shiftTop) + "px";
				span.style.left = (child.offsetLeft - shiftLeft) + "px";
				numbering.appendChild(span);
				
				// Increase paragraph counter
				//i++;
			//}
		});
	}
}
