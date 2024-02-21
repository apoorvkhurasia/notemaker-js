export function createListItem(displayText, linkAction) {
    const listItem = document.createElement("li");
    if (linkAction) {
        const linkElem = document.createElement("a");
        linkElem.appendChild(document.createTextNode(displayText));
        linkElem.onclick = linkAction;
        listItem.appendChild(linkElem);
    }
    return listItem;
}