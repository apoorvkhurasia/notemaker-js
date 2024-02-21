import * as fs from "./lib/fs.js";
import * as cmp from "./lib/components.js";

const State = {
    TOPICS: "topics",
    CHAPTER_LIST: "chapters",
}

var currentState = null;
var currentContentRoot = null;
var currentTopic = null;
var currentChapter = null;

$(function () {
    setState(State.TOPICS);
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

    const inputForm = document.getElementById("topic-or-chapter-input");
    inputForm.addEventListener("onkeyup", async (e) => {
        if (inputForm.is(":focus") && e.key === 'Enter') {
            await createNewTopicOrChapter(inputForm.val());
            inputForm.hide();
        }
    });
});

function getTopicOrChapterNameFromUser() {
    if (!currentContentRoot) return;
    const inputForm = document.getElementById("topic-or-chapter-input");
    inputForm.show();
}

async function createNewTopicOrChapter(userInput) {
    if (!currentContentRoot) return;

    const contentRootHandle = currentContentRoot;
    if (!userInput) {
        return;
    }

    const explorerListElem = $("#explorer-items");
    if (currentState === State.TOPICS) {
        topic = await fs.createNewTopic(contentRootHandle, userInput);
        explorerListElem.appendChild(cmp.createListItem(
            topic.displayName,
            async () => displayTopic(topic)));
    } else if (currentState === State.CHAPTER_LIST) {
        chapter = await fs.createNewChapter(contentRootHandle, chapterName);
        explorerListElem.appendChild(cmp.createListItem(
            chapter.displayName,
            async () => displayChapter(chapter)));
    }
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
                chapterToDisplay.chapterName,
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
            $("#new-topic-or-chapter").textContent = "New Topic";
            break;
        case State.CHAPTER_LIST:
            $("#main-content").show();
            $("#preview").show();
            $("#markdownInput").show();
            $("#save-chapter").show();
            $("#discard-chapter").show();
            $("#new-topic-or-chapter").textContent = "New Chapter";
            break;
        default:
            console.error("Invalid state: " + state);
            break;
    }
}

function clearChapterContent() {
    $("#markdownInput").val("");
    $("#preview").val("");
}
