import * as $ from 'jquery';
import * as fs from "./lib/fs";
import * as model from "./lib/model";
import * as exp from "./view/explorer";
import * as cnt from "./view/content";

require("./styles/main.css");

var currStoreDirectoryHandle: FileSystemDirectoryHandle = null;
var currentChapter: model.Chapter = null;
var explorer: exp.ExplorerView = null;
var content: cnt.ContentViewer = null;

$(function () {
    const openFileLink = document.getElementById("open-store");
    openFileLink.addEventListener("click", async () => {
        const storeDirectoryHandle = await window.showDirectoryPicker();
        await createTableOfContents(storeDirectoryHandle);
    });

    explorer = new exp.ExplorerView(document.getElementById("explorer-items"));
    content = new cnt.ContentViewer(
        document.getElementById("markdownInput"),
        document.getElementById("preview"));

    const newItemLink = document.getElementById("new-topic-or-chapter");
    newItemLink.addEventListener("click", getTopicOrChapterNameFromUser);

    document.getElementById("confirmTopicOrChapterCreationBtn")
        .addEventListener("click", createNewTopicOrChapter);

    document.getElementById("cancelCreateTopicOrChapterBtn")
        .addEventListener("click", cancelCreateTopicOrChapter);
});

function getTopicOrChapterNameFromUser() {
    $("#topic-or-chapter-input").val("");
    $("#topic-or-chapter-input-form").show();
}

async function createNewTopicOrChapter(): Promise<void> {
    // if (!currStoreDirectoryHandle) return;

    // const contentRootHandle = currStoreDirectoryHandle;
    // const userInput = $("#topic-or-chapter-input").val();
    // if (!userInput) {
    //     return;
    // }

    // const explorerListElem = document.getElementById("explorer-items");
    // if (currentState === State.TOPICS) {
    //     const topic = await fs.createNewTopic(contentRootHandle, userInput);
    //     explorerListElem.appendChild(cmp.createListItem(
    //         topic.displayName,
    //         async () => displayTopic(topic)));
    // } else if (currentState === State.CHAPTER_LIST && currentTopic) {
    //     const chapter = await fs.createNewChapter(contentRootHandle, currentTopic, userInput);
    //     explorerListElem.appendChild(cmp.createListItem(
    //         chapter.displayName,
    //         async () => displayChapter(chapter)));
    //     displayChapter(chapter);
    // }

    // $("#topic-or-chapter-input-form").hide();
}

async function cancelCreateTopicOrChapter(): Promise<void> {
    $("#topic-or-chapter-input-form").hide();
}

async function createTableOfContents(storeDirectoryHandle: FileSystemDirectoryHandle): Promise<void> {
    const topics = await fs.getTopics(storeDirectoryHandle);
    topics.sort();
    explorer.init(topics);
    currStoreDirectoryHandle = storeDirectoryHandle;
}

async function displayChapter(chapter: model.Chapter): Promise<void> {
    if (currStoreDirectoryHandle === null) return;
    currentChapter = chapter;
    if (chapter !== null) {
        const rawText = await fs.getChapterRawText(currStoreDirectoryHandle, chapter);
        content.setContent(rawText);
    }
}

function clearChapterContent(): void {
    content.setContent("");
}
