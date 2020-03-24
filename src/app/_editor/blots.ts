import * as uuid from 'uuid';

import * as QuillNamespace from 'quill';
const Quill: any = QuillNamespace;

const Block = Quill.import('blots/block');

export class Comment extends Block {

	static blotName = 'comment';
	static tagName = 'p';

	static create(d) {
		const node = super.create();
		node.setAttribute('data-line-id', d.lineId);
		return node;
	}
  
	static formats(node) {
		return {
			'lineId': node.getAttribute('data-line-id')
		};
	}
}
