export class EditableAnchorLIElement extends HTMLLIElement {
  public static readonly TAG_NAME = 'editable-li';

  private anchor: HTMLAnchorElement | null = null;
  private editor: HTMLInputElement | null = null;
  private _text = '';

  public constructor() {
    super();
    this.setAttribute('is', EditableAnchorLIElement.TAG_NAME);
  }

  connectedCallback(): void {
    this.editor = document.createElement('input');
    this.editor.classList.add('mini-editor');
    this.editor.style.display = 'none'; //default

    this.anchor = document.createElement('a');
    this.anchor.textContent = this._text;
    this.anchor.addEventListener('click', this.onAnchorClick);
    this.addEventListener('dblclick', this.showEditor);
    this.appendChild(this.anchor);
    this.appendChild(this.editor);
  }

  disconnectedCallback(): void {
    this.removeEventListener('dblclick', this.showEditor);
    if (this.anchor) {
      this.removeChild(this.anchor);
      this.anchor.removeEventListener('click', this.onAnchorClick);
    }
    if (this.editor) {
      this.removeChild(this.editor);
    }
  }

  get text(): string {
    return this._text;
  }

  set text(displayText: string) {
    if (displayText === null || displayText.length === 0) {
      this._text = '';
      if (this.anchor) {
        this.anchor.textContent = '';
      }
    } else {
      this._text = displayText;
      if (this.anchor) {
        this.anchor.textContent = displayText;
      }
    }
  }

  private showEditor(event: Event) {
    if (!this.editor || !this.anchor) {
      return;
    }
    event.stopPropagation(); //We've got this one, thank you very much.
    this.editor.value = this.text;
    this.editor.addEventListener('keyup', this.processKeyboardInput);
    this.removeEventListener('dblclick', this.showEditor);

    this.anchor.style.display = 'none';
    this.editor.style.display = 'block';

    this.editor.focus();
    this.editor.setSelectionRange(0, this.editor.value.length);
  }

  private hideEditor(): void {
    if (!this.editor || !this.anchor) {
      return;
    }
    this.editor.style.display = 'none';
    this.anchor.style.display = 'block';
    this.editor.removeEventListener('keyup', this.processKeyboardInput);
    this.addEventListener('dblclick', this.showEditor);
  }

  private processKeyboardInput(this: HTMLInputElement, e: KeyboardEvent): void {
    const parent = <EditableAnchorLIElement>this.parentElement;
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

  private onAnchorClick(): void {
    this.dispatchEvent(
      new Event('anchorclick', {
        bubbles: true,
        cancelable: false,
        composed: false,
      })
    );
  }
}

customElements.define(
  EditableAnchorLIElement.TAG_NAME,
  EditableAnchorLIElement,
  {
    extends: 'li',
  }
);
