import { parse } from "marked";
import * as $ from "jquery";

export class ContentViewer {

    private rawMarkdownEditorElement: Element;
    private renderedHtmlElement: Element;

    public constructor(
        rawMarkdownEditorElement: Element,
        renderedHtmlElement: Element) {
        this.rawMarkdownEditorElement = rawMarkdownEditorElement;
        this.rawMarkdownEditorElement.addEventListener("input", this.render);
        this.renderedHtmlElement = renderedHtmlElement;
    }

    public setContent(markdownText: string): void {
        this.rawMarkdownEditorElement.textContent = markdownText;
    }

    private async render() {
        const parsedHTML = await parse(
            this.rawMarkdownEditorElement.textContent);
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