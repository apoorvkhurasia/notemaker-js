import markdownIt from 'markdown-it';
import mathjax3 from 'markdown-it-mathjax3';
import React from 'react';
import {Chapter} from '../model/model';

export interface ContentViewerProps {
  selectedChapter: Chapter | null;
  originalRawMarkdownText: string;
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
}

export interface ContentViewerState {
  rawMarkdownText: string;
  parsedHTML: string;
}

export class ContentViewer extends React.Component<
  ContentViewerProps,
  ContentViewerState
> {
  private md = markdownIt({
    xhtmlOut: true,
  });

  public constructor(props: ContentViewerProps) {
    super(props);
    this.state = {
      rawMarkdownText: props.originalRawMarkdownText,
      parsedHTML: '<div></div>',
    };
    this.md.use(mathjax3);
  }

  update(rawText: string): void {
    const html = this.md.render(rawText);
    this.setState({rawMarkdownText: rawText, parsedHTML: html});
  }

  componentDidMount(): void {
    this.update(this.props.originalRawMarkdownText);
  }

  componentDidUpdate(
    prevProps: Readonly<ContentViewerProps>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prevState: Readonly<ContentViewerState>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    snapshot?: unknown
  ): void {
    if (
      prevProps.selectedChapter?.getId() === this.props.selectedChapter?.getId()
    ) {
      return;
    }
    this.update(this.props.originalRawMarkdownText);
  }

  public render() {
    return (
      <>
        <textarea
          id="markdownInput"
          style={
            this.props.selectedChapter === null
              ? {display: 'none'}
              : {display: 'block'}
          }
          className="editor-area"
          onChange={this.onMarkdownChange.bind(this)}
          value={this.state.rawMarkdownText}
          autoFocus={true}
          placeholder={'Type in markdown syntax here. LaTeX is supported.'}
        ></textarea>
        <div
          id="preview"
          className="formatted-content"
          dangerouslySetInnerHTML={{__html: this.state.parsedHTML}}
        ></div>
      </>
    );
  }

  private async onMarkdownChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    this.update(e.target.value);
  }
}
