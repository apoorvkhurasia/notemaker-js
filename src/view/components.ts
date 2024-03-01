export class EditableAndClickableListItem extends HTMLLIElement {
  private linkElement: HTMLAnchorElement | null = null;
  private displayElement: HTMLSpanElement | null = null;
  public constructor() {
    super();
  }

  connectedCallback(): void {
    const linkElem = document.createElement('a');
    const displayElement = this.createDisplayTextNode();
    linkElem.appendChild(displayElement);
    this.appendChild(linkElem);
    this.addEventListener('dblclick', this.showEditor);
    this.displayElement = displayElement;
    this.linkElement = linkElem;
  }

  disconnectedCallback() {
    console.log('removed: ' + this.text);
  }

  get text(): string {
    const val = this.getAttribute('text');
    if (val !== null) {
      return val;
    } else {
      return '';
    }
  }

  set text(displayText: string) {
    if (displayText === null || displayText.length === 0) {
      this.removeAttribute('text');
    } else {
      this.setAttribute('text', displayText);
    }
    if (this.displayElement !== null) {
      this.displayElement.textContent = displayText ?? '';
    }
  }

  private createDisplayTextNode(): HTMLSpanElement {
    const spanElem = document.createElement('span');
    spanElem.style.display = 'block';
    spanElem.textContent = this.text;
    return spanElem;
  }

  private showEditor(event: Event) {
    if (this.linkElement === null || this.displayElement === null) {
      return;
    }
    event.stopPropagation(); //We've got this one, thank you very much.

    //Hide the text, put the textbox instead
    this.linkElement.removeChild(this.displayElement);

    const editor = document.createElement('input');
    editor.value = this.text;
    editor.classList.add('mini-editor');
    editor.addEventListener('keyup', e => {
      if (this.linkElement === null || this.displayElement === null) {
        return;
      }
      if (e.key === 'Escape') {
        this.linkElement.removeChild(editor);
        this.linkElement.appendChild(this.displayElement);
      } else if (e.key === 'Enter') {
        this.text = editor.value.trim();
        this.linkElement.removeChild(editor);
        this.linkElement.appendChild(this.displayElement);
        this.dispatchEvent(
          new CustomEvent<string>('textchanged', {
            detail: this.text,
            bubbles: true,
            cancelable: false,
            composed: false,
          })
        );
      }
    });
    this.linkElement.appendChild(editor);
  }
}

customElements.define('editable-li', EditableAndClickableListItem, {
  extends: 'li',
});
