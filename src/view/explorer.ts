import * as model from "../lib/model";
import * as cmp from "./components";

export class ExplorerView implements model.ChapterObserver {

    private htmlRootElem: Element;

    public constructor(htmlRootElem: Element) {
        this.htmlRootElem = htmlRootElem;
    }

    public init(topics: Array<model.Topic>): void {
        const ownerDocument = this.htmlRootElem.ownerDocument;
        while (this.htmlRootElem.firstChild !== null) {
            this.htmlRootElem.removeChild(this.htmlRootElem.firstChild);
        }
        const topicListElem = ownerDocument.createElement("ul");
        topicListElem.id = "topic-list";
        for (const topic of topics) {
            const chapterElems = topic.getChapters().map(
                chapter => this.createChapterElement(chapter, ownerDocument));

            const chapterListElem = ownerDocument.createElement("ol");
            chapterElems.forEach(el => chapterListElem.appendChild(el));

            const topicElem = cmp.createListItem(
                ownerDocument,
                topic.getDisplayName(),
                topic.getId(), (ev) => {
                    for (const chapterElem of chapterElems) {
                        cmp.toggleElemVisibility(chapterElem);
                    }
                });
            topicElem.appendChild(chapterListElem);
            topicListElem.appendChild(topicElem);
        }
        this.htmlRootElem.appendChild(topicListElem);
    }

    public createChapterElement(chapter: model.Chapter, ownerDocument: Document): Element {
        return cmp.createListItem(
            ownerDocument,
            chapter.getDisplayName(),
            chapter.getTopic().getId() + "-" + chapter.getId(),
            (e) => dispatchEvent(new CustomEvent<model.Chapter>(
                'chapterChanged', {
                detail: chapter,
                bubbles: true,
                cancelable: false,
                composed: false
            })));
    }

    public onChapterMove(oldTopic: model.Topic, newTopic: model.Topic): void {
        //TODO: Implement when adding support for drag drop
    }
}