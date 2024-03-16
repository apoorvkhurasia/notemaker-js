import React, {RefObject, createRef} from 'react';
import {Chapter} from '../model/model';
import ReactDOM from 'react-dom';

export interface ChapterProps {
  chapter: Chapter;
}

export interface ChapterState {
  editingName: boolean;
  newChapterName: string;
  isSelected: boolean;
}

export type ChapterRenameArgs = {
  chapter: Chapter;
  newName: string;
};

export class ChapterElement extends React.Component<
  ChapterProps,
  ChapterState
> {
  private editorRef: RefObject<HTMLInputElement>;

  public constructor(chapterProps: ChapterProps) {
    super(chapterProps);
    this.editorRef = createRef();
    this.state = {
      isSelected: false,
      editingName: false,
      newChapterName: chapterProps.chapter.getDisplayName(),
    };
  }

  public render() {
    return (
      <li
        className={'chapter' + (this.state.isSelected ? ' selected' : '')}
        onClick={this.loadChapter.bind(this)}
        onDoubleClick={this.showEditor.bind(this)}
      >
        {this.state.editingName ? (
          <form
            // style={{display: this.state.editingName ? 'inline' : 'none'}}
            onSubmit={e => {
              e.preventDefault();
              this.renameChapter(this.state.newChapterName);
              this.hideEditor();
            }}
            onAbort={e => {
              e.preventDefault();
              this.setState({
                newChapterName: this.props.chapter.getDisplayName(), //Restore
                editingName: false,
              });
            }}
          >
            <input
              ref={this.editorRef}
              className="mini-editor"
              onKeyUp={this.processKeyboardInput.bind(this)}
              defaultValue={this.props.chapter.getDisplayName()}
              onChange={e => this.setState({newChapterName: e.target.value})}
            ></input>
            <input
              type="submit"
              style={{display: 'none'}}
              tabIndex={-1}
            ></input>
            <input type="reset" style={{display: 'none'}} tabIndex={-1}></input>
          </form>
        ) : (
          <div
            className="chapter-nav"
            // style={{display: this.state.editingName ? 'none' : 'inline'}}
          >
            {this.props.chapter.getDisplayName()}
          </div>
        )}
        {this.state.isSelected && !this.state.editingName && (
          <button
            className="explorer-mini-btn material-symbols-outlined"
            onClick={this.deleteChapterRequested.bind(this)}
          >
            delete
          </button>
        )}
      </li>
    );
  }

  public markSelected(isSelected: boolean) {
    this.setState({isSelected: isSelected});
    if (!isSelected) {
      this.setState({editingName: false});
    }
  }

  private showEditor(e: React.MouseEvent) {
    this.setState(
      {editingName: true},
      (() => {
        const editor = this.editorRef.current as HTMLInputElement;
        if (editor) {
          editor.focus();
          editor.setSelectionRange(0, editor.value.length);
        }
      }).bind(this)
    );
    e.stopPropagation();
  }

  private hideEditor() {
    this.setState({editingName: false, newChapterName: ''});
  }

  private processKeyboardInput(e: React.KeyboardEvent): void {
    if (e.key === 'Escape' || e.key === 'Enter') {
      this.hideEditor();
    }
  }

  private loadChapter(): void {
    const me = ReactDOM.findDOMNode(this);
    me?.dispatchEvent(
      new CustomEvent<Chapter>('selectChapterRequested', {
        detail: this.props.chapter,
        bubbles: true,
        cancelable: false,
        composed: false,
      })
    );
  }

  private renameChapter(newName: string): void {
    const me = ReactDOM.findDOMNode(this);
    me?.dispatchEvent(
      new CustomEvent<ChapterRenameArgs>('renameChapterRequseted', {
        detail: {chapter: this.props.chapter, newName: newName},
        bubbles: true,
        cancelable: false,
        composed: false,
      })
    );
  }

  private deleteChapterRequested(e: React.MouseEvent): void {
    if (
      !confirm(
        'Are you sure you want to delete chapter " ' +
          this.props.chapter.getDisplayName() +
          '"?'
      )
    ) {
      e.preventDefault();
    } else {
      const me = ReactDOM.findDOMNode(this);
      me?.dispatchEvent(
        new CustomEvent<Chapter>('deleteChapterRequested', {
          detail: this.props.chapter,
          bubbles: true,
          cancelable: false,
          composed: false,
        })
      );
    }
  }
}
