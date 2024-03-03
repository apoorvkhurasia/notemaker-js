import React, {RefObject, createRef} from 'react';
import {Chapter} from '../model/model';

export interface ChapterProps {
  chapter: Chapter;
}

export interface ChapterState {
  editingName: boolean;
  newChapterName: string;
  chapter: Chapter;
}

export class ChapterElement extends React.Component<
  ChapterProps,
  ChapterState
> {
  private liRef: RefObject<HTMLLIElement>;
  private editorRef: RefObject<HTMLInputElement>;

  public constructor(chapterProps: ChapterProps) {
    super(chapterProps);
    this.liRef = createRef();
    this.editorRef = createRef();
    this.state = {
      chapter: chapterProps.chapter,
      editingName: false,
      newChapterName: chapterProps.chapter.getDisplayName(),
    };
  }

  public render() {
    return (
      <li ref={this.liRef} className="chapter">
        <a
          onClick={this.loadChapter.bind(this)}
          onDoubleClick={this.showEditor.bind(this)}
          style={
            this.state.editingName ? {display: 'none'} : {display: 'block'}
          }
        >
          {this.state.chapter.getDisplayName()}
        </a>
        <form
          onSubmit={e => {
            e.preventDefault();
            this.state.chapter.setDisplayName(this.state.newChapterName);
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
            style={
              this.state.editingName ? {display: 'block'} : {display: 'none'}
            }
            autoFocus={true}
            defaultValue={this.props.chapter.getDisplayName()}
            onChange={e =>
              this.setState({newChapterName: e.target.value.trim()})
            }
          ></input>
          <input type="submit" style={{display: 'none'}} tabIndex={-1}></input>
          <input type="reset" style={{display: 'none'}} tabIndex={-1}></input>
        </form>
      </li>
    );
  }

  private showEditor(e: React.MouseEvent) {
    this.loadChapter();
    this.setState({editingName: true});
    const editor = this.editorRef.current as HTMLInputElement;
    if (editor) {
      editor.focus();
      editor.setSelectionRange(0, editor.value.length);
    }
    e.stopPropagation();
  }

  private hideEditor() {
    this.setState({editingName: false});
  }

  private processKeyboardInput(e: React.KeyboardEvent): void {
    if (e.key === 'Escape' || e.key === 'Enter') {
      this.hideEditor();
    }
  }

  private loadChapter(): void {
    const liElem = this.liRef.current as HTMLLIElement;
    if (liElem) {
      liElem.dispatchEvent(
        new CustomEvent<Chapter>('chapterselectedevent', {
          detail: this.props.chapter,
          bubbles: true,
          cancelable: false,
          composed: false,
        })
      );
    }
  }
}
