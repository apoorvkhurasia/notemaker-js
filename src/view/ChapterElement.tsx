import React from 'react';
import {Chapter} from '../model/model';

export interface ChapterProps {
  chapter: Chapter;
}

export interface ChapterState {
  editingName: boolean;
}

export class ChapterElement extends React.Component<
  ChapterProps,
  ChapterState
> {
  public constructor(chapterProps: ChapterProps) {
    super(chapterProps);
    this.state = {editingName: false};
  }

  public render() {
    return (
      <li onDoubleClick={this.showEditor.bind(this)} className="chapter">
        <a
          id="anchor"
          onClick={this.loadChapter.bind(this)}
          style={
            this.state.editingName ? {display: 'none'} : {display: 'block'}
          }
        >
          {this.props.chapter.getDisplayName()}
        </a>
        <input
          id="editor"
          className="mini-editor"
          onKeyUp={this.processKeyboardInput.bind(this)}
          style={
            this.state.editingName ? {display: 'block'} : {display: 'none'}
          }
          autoFocus={true}
          value={this.props.chapter.getDisplayName()}
        ></input>
      </li>
    );
  }

  private showEditor(event: React.MouseEvent) {
    this.setState({editingName: true});
    // const editor = document.getElementById('editor') as HTMLInputElement;
    // const anchor = document.getElementById('anchor') as HTMLAnchorElement;
    // event.stopPropagation(); //We've got this one, thank you very much.
    // editor.value = this.props.chapter.getDisplayName();
    // anchor.style.display = 'none';
    // editor.style.display = 'block';

    // editor.focus();
    // editor.setSelectionRange(0, editor.value.length);
  }

  private hideEditor() {
    this.setState({editingName: false});
  }

  private processKeyboardInput(e: React.KeyboardEvent): void {
    if (!parent) {
      return;
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      this.hideEditor();
    } else if (e.key === 'Enter') {
      e.stopPropagation();
      const newName = (e.target as HTMLTextAreaElement).value;
      this.props.chapter.setDisplayName(newName.trim());
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
