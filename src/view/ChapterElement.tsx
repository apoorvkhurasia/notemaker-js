import React from 'react';
import {Chapter} from '../model/model';

export interface ChapterProps {
  chapter: Chapter;
}

export class ChapterElement extends React.Component<ChapterProps, {}> {
  public constructor(chapterProps: ChapterProps) {
    super(chapterProps);
  }

  public render() {
    return (
      <li onDoubleClick={this.showEditor.bind(this)} className="chapter">
        <a id="anchor" onClick={this.loadChapter.bind(this)}>
          {this.props.chapter.getDisplayName()}
        </a>
        <input
          id="editor"
          className="mini-editor"
          onKeyUp={this.processKeyboardInput.bind(this)}
          style={{display: 'none'}}
          onKeyUp={this.processKeyboardInput.bind(this)}
          style={{display: 'none'}}
        ></input>
      </li>
    );
  }

  private showEditor(event: React.MouseEvent) {
    const editor = document.getElementById('editor') as HTMLInputElement;
    const anchor = document.getElementById('anchor') as HTMLAnchorElement;
    event.stopPropagation(); //We've got this one, thank you very much.
    editor.value = this.props.chapter.getDisplayName();
    anchor.style.display = 'none';
    editor.style.display = 'block';

    editor.focus();
    editor.setSelectionRange(0, editor.value.length);
  }

  private hideEditor() {
    const editor = document.getElementById('editor') as HTMLInputElement;
    const anchor = document.getElementById('anchor') as HTMLAnchorElement;
    editor.style.display = 'none';
    anchor.style.display = 'block';
  }

  private processKeyboardInput(e: React.KeyboardEvent): void {
    if (!parent) {
      return;
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      this.hideEditor();
    } else if (e.key === 'Enter') {
      e.stopPropagation();
      this.hideEditor();

      const editor = document.getElementById('editor') as HTMLInputElement;
      const anchor = document.getElementById('anchor') as HTMLAnchorElement;
      this.props.chapter.setDisplayName(editor.value.trim());
      anchor.text = this.props.chapter.getDisplayName();
    }
  }

  private loadChapter(): void {
    dispatchEvent(
      new CustomEvent<Chapter>('chapterChanged', {
        detail: this.props.chapter,
        bubbles: true,
        cancelable: false,
        composed: false,
      })
    );
  }
}
