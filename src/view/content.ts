import {parse} from 'marked';
import * as $ from 'jquery';

export class ContentViewer {
  private rawMarkdownEditorElement: HTMLTextAreaElement;
  private renderedHtmlElement: HTMLElement;

  public constructor(
    rawMarkdownEditorElement: HTMLTextAreaElement,
    renderedHtmlElement: HTMLElement
  ) {
    this.rawMarkdownEditorElement = rawMarkdownEditorElement;
    this.rawMarkdownEditorElement.addEventListener(
      'input',
      async () => await this.render()
    );
    this.renderedHtmlElement = renderedHtmlElement;
  }

  public setContent(markdownText: string): void {
    this.rawMarkdownEditorElement.value = markdownText;
    this.render();
  }

  private async render() {
    const rawText = this.rawMarkdownEditorElement.value;
    const parsedHTML = await parse(rawText);
    this.renderedHtmlElement.innerHTML = parsedHTML;
  }

  public hideEditor(): void {
    $(this.rawMarkdownEditorElement.id).hide();
  }

  public showEditor(): void {
    $(this.rawMarkdownEditorElement.id).show();
  }

  public hideHtml() {
    $(this.renderedHtmlElement.id).hide();
  }

  public showHtml(): void {
    $(this.renderedHtmlElement.id).show();
  }
}
