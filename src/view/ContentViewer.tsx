import showdown from 'showdown';
import React, {createRef} from 'react';
import {Chapter} from '../model/model';

export interface ContentViewerProps {
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
}

export interface ChapterChangeArgs {
  chapter: Chapter;
  rawMarkdownText: string;
}

export interface ContentViewerState {
  isInitialising: boolean;
  selectedChapter: Chapter | null;
  rawMarkdownText: string;
  parsedHTML: string;
}

export class ContentViewer extends React.Component<
  ContentViewerProps,
  ContentViewerState
> {
  private converter = new showdown.Converter({
    metadata: true,
    parseImgDimensions: true,
    simplifiedAutoLink: true,
    tables: true,
    strikethrough: true,
    tasklists: true,
    smoothLivePreview: true,
    smartIndentationFix: false,
    requireSpaceBeforeHeadingText: true,
    openLinksInNewWindow: true,
    ellipsis: true,
    simpleLineBreaks: true,
  });
  private editorRef: React.RefObject<HTMLTextAreaElement>;
  private previewRef: React.RefObject<HTMLDivElement>;

  public constructor(props: ContentViewerProps) {
    super(props);
    this.editorRef = createRef();
    this.previewRef = createRef();
    this.state = {
      isInitialising: true,
      selectedChapter: null,
      rawMarkdownText: '',
      parsedHTML: '<div></div>',
    };
  }

  componentDidUpdate(
    prevProps: Readonly<ContentViewerProps>,
    _prevState: Readonly<ContentViewerState>,
    _snapshot?: unknown
  ): void {
    if (prevProps.previewVisible !== this.props.previewVisible) {
      this.update(this.state.rawMarkdownText);
    }
  }

  public render() {
    return (
      <>
        <textarea
          id="markdownInput"
          ref={this.editorRef}
          style={{
            display:
              this.state.selectedChapter !== null && this.props.editorVisible
                ? 'block'
                : 'none',
          }}
          className={this.props.previewVisible ? 'half-editor' : 'full-editor'}
          onChange={this.onMarkdownChange.bind(this)}
          value={this.state.rawMarkdownText}
          placeholder={
            'Type in markdown syntax here. LaTeX is not supported yet.'
          }
        ></textarea>
        <div
          id="preview"
          ref={this.previewRef}
          className={this.props.editorVisible ? 'half-preview' : 'full-preview'}
          style={
            this.props.previewVisible ? {display: 'block'} : {display: 'none'}
          }
          dangerouslySetInnerHTML={{__html: this.state.parsedHTML}}
        ></div>
      </>
    );
  }

  public getSelectedChapter(): Chapter | null {
    return this.state.selectedChapter;
  }

  public display(chapter: Chapter | null, rawMarkdownText: string): void {
    //New chapter
    this.setState({isInitialising: true, selectedChapter: chapter}, () => {
      this.update(rawMarkdownText);
      this.setState({isInitialising: false});
      const preview = this.previewRef.current;
      if (preview) {
        preview.scrollTop = 0;
      }
      const editor = this.editorRef.current;
      if (editor) {
        editor.scrollTop = 0;
      }
    });
  }

  private async onMarkdownChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    this.update(e.target.value);
  }

  private update(rawText: string): void {
    const editor = this.editorRef.current;
    if (!this.state.isInitialising && editor) {
      editor.dispatchEvent(
        new CustomEvent<ChapterChangeArgs>('chapterContentChanged', {
          detail: {
            chapter: this.state.selectedChapter as Chapter,
            rawMarkdownText: rawText,
          },
          bubbles: true,
          cancelable: false,
          composed: false,
        })
      );
    }
    if (this.props.previewVisible) {
      const html = this.converter.makeHtml(rawText);
      this.setState({
        rawMarkdownText: rawText,
        parsedHTML: html,
      });
    } else {
      this.setState({
        rawMarkdownText: rawText,
      });
    }
  }
}
