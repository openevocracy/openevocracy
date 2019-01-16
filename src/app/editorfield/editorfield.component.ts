import { Component, Input, Output, EventEmitter } from '@angular/core';

import * as _ from 'underscore';

@Component({
	selector: 'editor-field',
	templateUrl: './editorfield.component.html',
	styleUrls: ['./editorfield.component.scss']
})
export class EditorFieldComponent {
	
	@Input() labelKey: string;
	@Input() required: string;
	
	@Output() onEditorCreated = new EventEmitter();
	
	public quillModules;
	
	// Form validation status
	public wasTouched: boolean = false;
	public isDirty: boolean = false;
	public isEmpty: boolean = true;
	public hasFocus: boolean = false;

	constructor() {
		this.quillModules = {
			toolbar: [
				['bold', 'italic', 'underline', 'strike'],
				[{ 'list': 'ordered'}, { 'list': 'bullet' }],
				[{ 'indent': '-1'}, { 'indent': '+1' }],
				['link'],
				['clean']
			]
		}
	}
	
	/*
	 * @desc: Called from quill editor component, when editor is ready
	 */
	private editorCreated(editor: any) {
		this.onEditorCreated.emit(editor);
	}
	
	/*
	 * @desc: Called from quill editor component, when something was typed
	 */
	private contentChanged(e: any) {
		// Set dirty variable
		if(!this.isDirty) this.isDirty = true;
		
		// Set empty variable
		let text = e.editor.getText();
		this.isEmpty = (text.trim() == "");
	}
	
	/*
	 * @desc: Called from quill editor component, when something was selected/deselcted
	 */
	private selectionChanged(e: any) {
		// Editor is focused if range is not null and not focuses otherwise
		this.hasFocus = !_.isNull(e.range);
		
		// Editor was touched if range is null again
		if(!this.wasTouched && _.isNull(e.range)) this.wasTouched = true;
	}

}
