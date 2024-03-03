import {parse} from 'marked';
import React from 'react';

export interface ContentViewerProps {
  rawMarkdownText: string;
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
}

export interface ContentViewerState {
  parsedText: string;
}

export class ContentViewer extends React.Component<
  ContentViewerProps,
  ContentViewerState
> {
  public constructor(props: ContentViewerProps, state: ContentViewerState) {
    super(props);
    this.state = {parsedText: '<div></div>'};
  }

  public render() {
    return (
      <>
        <textarea
          id="markdownInput"
          className="editor-area"
          onInput={this.onMarkdownInput.bind(this)}
          value={this.props.rawMarkdownText}
        ></textarea>
        <div
          id="preview"
          className="formatted-content"
          dangerouslySetInnerHTML={{__html: this.state.parsedText}}
        ></div>
      </>
    );
  }

  private async onMarkdownInput(
    inputEvent: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const rawText = inputEvent.target.value;
    const parsedHTML = await parse(rawText);
    this.setState(() => ({parsedText: parsedHTML}));
  }

  componentDidMount() {
    const parseResult = parse(this.props.rawMarkdownText);
    if (typeof parseResult === 'string') {
      this.setState(() => ({parsedText: parseResult}));
    } else {
      parseResult.then(parsedHtml =>
        this.setState(() => ({parsedText: parsedHtml}))
      );
    }
  }
}
