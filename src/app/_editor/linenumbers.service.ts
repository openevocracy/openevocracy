import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class LineNumbersService {

	constructor() { }
	
	/**
	 * @desc: Calculate and show line numbers
	 */
	public getLineNumbers(quill) {
    
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
				const span = document.createElement('span');
				span.dataset.line = String(i);
				span.innerText = String(i);
				/*span.addEventListener("click", (e: KeyboardEvent) => {
					
					// NOTE: The comment shall not be directly created when the user clicks a number, this is just for testing
					
					const lineNumber = (<HTMLInputElement>e.target).dataset.line;
					const lines = quill.getText().split('\n');
					
					let n = 0;
					let index = 0;
					for (let line of lines) {
						// Increase line counter, start with 1
						n++;
						// Stop if counter reached clicked line
						if (n == i) break;
						// Add length of line (+ \n) to counter
						index += line.length + 1;
					}
					
					// Add comment format to line
					quill.formatLine(index, 1, 'comment', { 'lineId': Date.now() }, 'user');
					
				});*/
				
				// Define styles for every line number
				span.style.top = (child.offsetTop + shiftTop) + 'px';
				span.style.left = (child.offsetLeft - shiftLeft) + 'px';
				span.style.lineHeight = child.offsetHeight + 'px'
				numbering.appendChild(span);
				
				// Increase paragraph counter
				//i++;
			//}
		});
	}
}
