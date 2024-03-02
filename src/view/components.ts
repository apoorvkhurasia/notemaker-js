export class EditableSpan extends HTMLSpanElement {
  public static readonly TAG_NAME = 'editable-span';

  private textNode: Text;
  private editor: HTMLInputElement;
  private _text = '';

  public constructor() {
    super();
    this.editor = document.createElement('input');
    this.editor.classList.add('mini-editor');
    this.textNode = document.createTextNode('');
    this.setAttribute('is', EditableSpan.TAG_NAME);
    this.style.display = 'block';
  }

  connectedCallback(): void {
    this.addEventListener('dblclick', this.showEditor);
    this.appendChild(this.textNode);
  }

  disconnectedCallback(): void {
    this.removeEventListener('dblclick', this.showEditor);
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  }

  get text(): string {
    return this._text;
  }

  set text(displayText: string) {
    if (displayText === null || displayText.length === 0) {
      this._text = '';
      this.textNode.nodeValue = '';
    } else {
      this._text = displayText;
      this.textNode.nodeValue = displayText;
    }
  }

  private showEditor(event: Event) {
    event.stopPropagation(); //We've got this one, thank you very much.
    this.editor.value = this.text;
    this.editor.addEventListener('keyup', this.processKeyboardInput);
    this.removeEventListener('dblclick', this.showEditor);
    this.removeChild(this.textNode);
    this.appendChild(this.editor);
    this.editor.focus();
    this.editor.setSelectionRange(0, this.editor.value.length);
  }

  private hideEditor(): void {
    this.removeChild(this.editor);
    this.appendChild(this.textNode);
    this.editor.removeEventListener('keyup', this.processKeyboardInput);
    this.addEventListener('dblclick', this.showEditor);
  }

  private processKeyboardInput(this: HTMLInputElement, e: KeyboardEvent): void {
    const parent = <EditableSpan>this.parentElement;
    if (!parent) {
      return;
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      parent.hideEditor();
    } else if (e.key === 'Enter') {
      e.stopPropagation();
      parent.hideEditor();
      parent.text = this.value.trim();
    }
  }
}

customElements.define(EditableSpan.TAG_NAME, EditableSpan, {
  extends: 'span',
});
