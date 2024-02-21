import * as fs from "./lib/fs.js";
import * as cmp from "./lib/components.js";

const State = {
    BLANK: "blank",
    TOPICS: "topics",
    CHAPTER_LIST: "chapters",
}

var currentState = null;
var currentContentRoot = null;
var currentTopic = null;
var currentChapter = null;

$(function () {
    setState(State.BLANK);
    const openFileLink = document.getElementById("open-store");
    openFileLink.addEventListener("click", async () => {
        currentContentRoot = await window.showDirectoryPicker();
        setState(State.TOPICS);
        await createTopicList(currentContentRoot);
    });

    const markdownInputArea = document.getElementById("markdownInput");
    markdownInputArea.addEventListener("input", render);

    const newItemLink = document.getElementById("new-topic-or-chapter");
    newItemLink.addEventListener("click", getTopicOrChapterNameFromUser);

    document.getElementById("confirmTopicOrChapterCreationBtn")
        .addEventListener("click", createNewTopicOrChapter);

    document.getElementById("cancelCreateTopicOrChapterBtn")
        .addEventListener("click", cancelCreateTopicOrChapter);
});

function getTopicOrChapterNameFromUser() {
    if (!currentContentRoot) return;
    $("#topic-or-chapter-input").val("");
    $("#topic-or-chapter-input-form").show();
}

async function createNewTopicOrChapter() {
    if (!currentContentRoot) return;

    const contentRootHandle = currentContentRoot;
    const userInput = $("#topic-or-chapter-input").val();
    if (!userInput) {
        return;
    }

    const explorerListElem = document.getElementById("explorer-items");
    if (currentState === State.TOPICS) {
        const topic = await fs.createNewTopic(contentRootHandle, userInput);
        explorerListElem.appendChild(cmp.createListItem(
            topic.displayName,
            async () => displayTopic(topic)));
    } else if (currentState === State.CHAPTER_LIST && currentTopic) {
        const chapter = await fs.createNewChapter(contentRootHandle, currentTopic, userInput);
        explorerListElem.appendChild(cmp.createListItem(
            chapter.displayName,
            async () => displayChapter(chapter)));
        displayChapter(chapter);
    }

    $("#topic-or-chapter-input-form").hide();
}

async function cancelCreateTopicOrChapter(event) {
    $("#topic-or-chapter-input-form").hide();
}

async function createTopicList() {
    if (!currentContentRoot || currentState !== State.TOPICS) return;

    const contentRootHandle = currentContentRoot;
    const topicListElem = document.getElementById("explorer-items");
    while (topicListElem.firstChild) {
        topicListElem.removeChild(topicListElem.firstChild);
    }
    const topics = await fs.getTopics(contentRootHandle);
    topics.sort();
    for (const topic of topics) {
        topicListElem.appendChild(cmp.createListItem(
            topic.displayName,
            async () => displayTopic(topic)));
    }
}

async function displayTopic(topic) {
    if (!currentContentRoot) return;
    setState(State.CHAPTER_LIST);
    clearChapterContent();
    currentTopic = topic;
    currentChapter = null;
    if (topic) {
        const chapterList = await fs.getChapters(currentContentRoot, topic);
        chapterList.sort();
        updateTableOfContents(chapterList);
    }
}

async function displayChapter(chapter) {
    if (!currentContentRoot) return;
    currentChapter = chapter;
    if (chapter) {
        currentTopic = chapter.topic;
        const rawText = await fs.getChapterRawText(currentContentRoot, chapter);
        $("#markdownInput").val(rawText);
        render();
    }
}

function updateTableOfContents(chapterList) {
    if (currentState !== State.CHAPTER_LIST) return;
    if (!currentContentRoot) return;

    const chapterListElems = document.getElementById("explorer-items");
    while (chapterListElems.firstChild) {
        chapterListElems.removeChild(chapterListElems.firstChild);
    }

    for (const chapterToDisplay of chapterList) {
        chapterListElems.appendChild(
            cmp.createListItem(
                chapterToDisplay.displayName,
                async () => await displayChapter(chapterToDisplay)
            )
        );
    }
}

function render() {
    var md = $("#markdownInput").val();
    var parsedHTML = marked.parse(md);
    $("#preview").html(parsedHTML);
}

function setState(state) {
    currentState = state;
    switch (state) {
        case State.TOPICS:
            $("#preview").hide();
            $("#main-content").hide();
            $("#save-chapter").hide();
            $("#discard-chapter").hide();
            $("#new-topic-or-chapter").show();
            $("#new-topic-or-chapter").text("New Topic");
            break;
        case State.CHAPTER_LIST:
            $("#main-content").show();
            $("#preview").show();
            $("#markdownInput").show();
            $("#save-chapter").show();
            $("#discard-chapter").show();
            $("#new-topic-or-chapter").show();
            $("#new-topic-or-chapter").text("New Chapter");
            break;
        default:
            $("#preview").hide();
            $("#main-content").hide();
            $("#save-chapter").hide();
            $("#discard-chapter").hide();
            $("#new-topic-or-chapter").hide();
            $("#topic-or-chapter-input-form").hide();
            break;
    }
}

function clearChapterContent() {
    $("#markdownInput").val("");
    $("#preview").val("");
}
