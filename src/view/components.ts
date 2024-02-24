export const hiddenClassName: string = ".hidden";

export function toggleElemVisibility(element: Element): void {
    if (element.classList.contains(this.hiddenClassName)) {
        element.classList.add(this.hiddenClassName);
    }
    else {
        element.classList.remove(this.hiddenClassName);
    }
}

export function createListItem(document: Document,
    displayText: string,
    identifier: string,
    clickAction: (this: GlobalEventHandlers, ev: MouseEvent) => any): Element {
    const listItem = document.createElement("li");
    listItem.id = identifier;
    if (clickAction !== null) {
        const linkElem = document.createElement("a");
        linkElem.appendChild(document.createTextNode(displayText));
        linkElem.onclick = clickAction;
        listItem.appendChild(linkElem);
    }
    return listItem;
}