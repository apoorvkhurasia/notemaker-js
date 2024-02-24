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

enum CreateMode {
    TOPIC,
    CHAPTER
}

var createMode = CreateMode.TOPIC;

$(function () {
    const explorerItems = document.getElementById("explorer-items");
    explorer = new exp.ExplorerView(explorerItems);
    explorerItems.addEventListener("chapterChanged",
        async (ev: CustomEvent<model.Chapter>) => await displayChapter(ev.detail));
    const markdownInputArea = document.getElementById("markdownInput") as HTMLTextAreaElement;
    content = new cnt.ContentViewer(
        markdownInputArea,
        document.getElementById("preview"));

    const newTopicLink = $("#new-topic");
    newTopicLink.on("click", () => initCreate(CreateMode.TOPIC));
    newTopicLink.hide();

    const newChapterLink = $("#new-chapter");
    newChapterLink.on("click", () => initCreate(CreateMode.CHAPTER));
    newChapterLink.hide();

    $("#topic-or-chapter-input-form").hide();
    const saveChapterLink = $("#save-chapter");
    saveChapterLink.on("click",
        async () => await fs.saveChapter(
            currStoreDirectoryHandle, currentChapter, markdownInputArea.value));
    saveChapterLink.hide();

    const discardChapterLink = $("#discard-chapter");
    discardChapterLink.on("click", async () => await displayChapter(currentChapter));
    discardChapterLink.hide();

    const openFileLink = document.getElementById("open-store");
    openFileLink.addEventListener("click", async () => {
        const storeDirectoryHandle = await window.showDirectoryPicker();
        await createTableOfContents(storeDirectoryHandle);
        newTopicLink.show();
    });

    document.getElementById("confirmTopicOrChapterCreationBtn")
        .addEventListener("click", finishCreateChapterOrTopic);

    document.getElementById("cancelCreateTopicOrChapterBtn")
        .addEventListener("click", cancelCreateTopicOrChapter);
});

function initCreate(mode: CreateMode): void {
    createMode = mode;
    $("#topic-or-chapter-input").val("");
    $("#topic-or-chapter-input-label").val("Topic Name");
    $("#topic-or-chapter-input-form").show();
}

async function finishCreateChapterOrTopic(): Promise<void> {
    const contentRootHandle = currStoreDirectoryHandle;
    const userInput = $("#topic-or-chapter-input").val();
    if (typeof userInput === "string") {
        switch (createMode) {
            case CreateMode.TOPIC:
                const topic = await fs.createNewTopic(contentRootHandle, userInput);
                explorer.onTopicCreated(topic);
                break;
            case CreateMode.CHAPTER:
                const currentTopic = currentChapter.getTopic();
                const chapter = await fs.createNewChapter(contentRootHandle, currentTopic, userInput);
                explorer.onChapterCreated(chapter);
                displayChapter(chapter);
                break;
            default:
                break;
        }
    }
    $("#topic-or-chapter-input-form").hide();
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
    $("#new-chapter").show();
    $("#save-chapter").show();
    $("#discard-chapter").show();
}

function clearChapterContent(): void {
    content.setContent("");
}
