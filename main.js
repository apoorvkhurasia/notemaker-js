import * as fs from "./lib/fs.js";
import * as cmp from "./lib/components.js";

const State = {
    TOPICS: "topics",
    TABLE_OF_CONTENTS: "table-of-contents",
    CHAPTER_DISPLAY_BUT_NOT_EDIT: "chapter-no-edit",
    CHAPTER_EDIT: "chapter-edit",
    CHAPTER_EDIT_FINISHED: "chapter-edit-finished",
    CHAPTER_EDIT_IN_PROGRESS: "chapter-edit-in-progress"
}

var currentContentRoot = null;
var currentTopic = null;
var currentChapter = null;

$(function () {
    initApp();
    // const increaseFontSizeBtn = document.getElementById("increase-font-size");
    // increaseFontSizeBtn.addEventListener("click", increaseInputFontSize);

    // const decreaseFontSizeBtn = document.getElementById("decrease-font-size");
    // decreaseFontSizeBtn.addEventListener("click", decreaseInputFontSize);
});

function initApp() {
    state(State.TOPICS);
    const openFileLink = document.getElementById("open-store");
    openFileLink.addEventListener("click", async () => {
        currentContentRoot = await window.showDirectoryPicker();
        await createTopicList(dirHandle);
    });

    const markdownInputArea = document.getElementById("markdownInput");
    markdownInputArea.addEventListener("onkeyup", render);
}

async function createTopicList(contentRootHandle) {
    const topicListElem = document.getElementById("explorer-items");
    const topics = await fs.getTopics(contentRootHandle);
    for (const topic of topics) {
        topicListElem.appendChild(cmp.createListItem(
            topic.displayName,
            async () => displayTopic(contentRootHandle, topic)));
    }

    const topicListLink = document.getElementById("toplist-link");
    topicListLink.removeEventListener("click");
    topicListLink.addEventListener("click", async () => createTopicList(contentRootHandle));

    const newTopicCreateListItem = document.createElement("li");
    const newTopicCreationHintLabel = document.createElement("label");
    newTopicCreationHintLabel.appendChild(document.createTextNode("Create a new topic with name: "));
    newTopicCreateListItem.appendChild(newTopicCreationHintLabel);

    const newTopicNameInput = document.createElement("input");
    newTopicNameInput.setAttribute("id", "newTopicName");
    newTopicNameInput.setAttribute("name", "newTopicName");
    newTopicCreateListItem.appendChild(newTopicNameInput);

    const createNewTopicBtn = document.createElement("button");
    createNewTopicBtn.setAttribute("id", "createNewTopicBtn");
    createNewTopicBtn.setAttribute("name", "createNewTopicBtn");
    createNewTopicBtn.appendChild(document.createTextNode("Create"));
    createNewTopicBtn.addEventListener("click", async () => {
        createNewTopicBtn.setAttribute("disabled", true); //disabled until callback completes
        const topicName = newTopicNameInput.value;
        try {
            const createdTopic = await fs.createNewTopic(contentRootHandle, topicName);
            await displayTopic(createdTopic);
        } catch (err) {
            console.log(err);
        } finally {
            createNewTopicBtn.setAttribute("disabled", false);
        }
    });

    newTopicCreateListItem.appendChild(createNewTopicBtn);
    topicListElem.appendChild(newTopicCreateListItem);
    appendAsOnlyChild("#topics", topicListElem);
    state(State.TOPICS);
}

async function displayTopic(contentRootHandle, topic, edit = false) {
    clearChapterContent();
    currentTopic = topic;
    currentChapter = null;

    const chapterList = await fs.getChapters(contentRootHandle, topic);
    updateTableOfContents(contentRootHandle, topic, chapterList);
    state(State.TABLE_OF_CONTENTS);
    if (edit) {
        appendChapter();
    }
}

async function displayChapter(contentRootHandle, chapter, edit = false, updateTOC = false) {
    currentChapter = chapter;
    if (chapter) {
        currentTopic = chapter.topic;
        $("#chapterName").val(currentChapter.displayName);
        const rawText = await fs.getChapterRawText(contentRootHandle, chapter);
        $("#markdownInput").val(rawText);
        render();
        if (!edit) {
            state(State.CHAPTER_DISPLAY_BUT_NOT_EDIT);
        } else {
            state(State.CHAPTER_EDIT);
        }
        if (updateTOC) {
            updateTableOfContents(chapter.topic, []);
        }
    }
}

function appendChapter() {
    currentChapter = null;
    clearChapterContent();
    state(State.CHAPTER_EDIT);
}

function updateTableOfContents(contentRootHandle, topic, chapterList) {
    appendAsOnlyChild("#heading", document.createTextNode("Notes on " + topic.displayName));
    const chapterListElems = document.createElement("ol");
    for (const chapterToDisplay of chapterList) {
        chapterListElems.appendChild(
            createListItem(
                chapterToDisplay.chapterName,
                async () => await displayChapter(contentRootHandle, chapterToDisplay)
            )
        );
    }

    const appendNewChapterElem = createListItem("Append", () => appendChapter());
    appendNewChapterElem.appendChild(document.createTextNode(" a new chapter on this topic."));
    chapterListElems.appendChild(appendNewChapterElem);
    appendAsOnlyChild("#chapters", chapterListElems);
}

async function upsertChapter(contentRootHandle) {
    var chapterToSave = currentChapter;
    if (!chapterToSave) {
        chapterToSave = new Chapter(currentTopic, chapterName.value);
    }
    state(State.CHAPTER_EDIT_IN_PROGRESS);
    try {
        chapter = await fs.saveChapter(contentRootHandle, currentChapter, markdownInput.value);
        displayChapter(contentRootHandle, chapter, false, true);
    } catch (err) {
        console.log(err);
        state(State.ERROR, err);
    } finally {
        state(State.CHAPTER_EDIT_FINISHED);
    }
}

async function cancelEditChapter(contentRootHandle) {
    //Whenever we next go into edit mode; we will enable these buttons
    $("#finishEdit").prop("disabled", true);
    $("#cancelEdit").prop("disabled", true);
    if (currentChapter) {
        await displayChapter(contentRootHandle, currentChapter);
    } else if (currentTopic) {
        await displayTopic(currentTopic);
    } else {
        await createTopicList(contentRootHandle);
    }
}

function appendAsOnlyChild(selector, childElem) {
    $(selector).empty();
    $(selector).append(childElem);
}

function showEditor() {
    $("#editor").show();
    $("#editLink").hide();
}

function hideEditor() {
    $("#editor").hide();
    $("#editLink").show();
}

function render() {
    var underScoreEscapedMarkdown = $("#markdownInput").val().replaceAll("_", "\\_");
    var parsedHTML = marked.parse(underScoreEscapedMarkdown);
    $("#parsedMarkdown").html(parsedHTML);
    Preview.Update();
}

function increaseInputFontSize() {
    var currFontSize = parseInt($("#markdownInput").css("font-size").replace("px", ""));
    $("#markdownInput").css("font-size", (currFontSize + 1) + "px");
}

function decreaseInputFontSize() {
    var currFontSize = parseInt($("#markdownInput").css("font-size").replace("px", ""));
    $("#markdownInput").css("font-size", (currFontSize - 1) + "px");
}

function cancelEditChapter() {
    //Whenever we next go into edit mode; we will enable these buttons
    $("#finishEdit").prop("disabled", true);
    $("#cancelEdit").prop("disabled", true);
    if (currentChapter) {
        displayChapter(currentChapter);
    } else if (currentTopic) {
        displayTopic(currentTopic);
    } else {
        createTopicList();
    }
}

function showErrorDetails() {
    $("#errorDetails").show();
    $("#showHideErrLink").text("Hide Technical Details");
    errorDetailsVisible = true;
}

function hideErrorDetails() {
    $("#errorDetails").hide();
    $("#showHideErrLink").text("Show Technical Details");
    errorDetailsVisible = false;
}

function toggleErrorMsgDetails() {
    if (errorDetailsVisible === false) {
        showErrorDetails();
    } else {
        hideErrorDetails();
    }
}

function state(state, errorTechDetails) {
    if (typeof (errorTechDetails) === "undefined") errorTechDetails = "No technical details available.";
    switch (state) {
        case State.TOPICS:
            $("#allTopics").show();
            $("#topicContent").hide();
            $("#error").hide();
            break;
        case State.TABLE_OF_CONTENTS:
            $("#chapterContent").hide();
            $("#allTopics").hide();
            $("#topicContent").show();
            $("#error").hide();
            break;
        case State.CHAPTER_DISPLAY_BUT_NOT_EDIT:
            $("#allTopics").hide();
            $("#chapterContent").show();
            $("#topicContent").show();
            $("#error").hide();
            hideEditor();
            break;
        case State.CHAPTER_EDIT:
            $("#allTopics").hide();
            $("#chapterContent").show();
            $("#topicContent").show();
            $("#finishEdit").prop("disabled", false);
            $("#cancelEdit").prop("disabled", false);
            $("#error").hide();
            showEditor();
            break;
        case State.CHAPTER_EDIT_FINISHED:
            $("#finishEdit").prop("disabled", false);
            $("#cancelEdit").prop("disabled", false);
            break;
        case State.CHAPTER_EDIT_IN_PROGRESS:
            $("#finishEdit").prop("disabled", true);
            $("#cancelEdit").prop("disabled", true);
            break;
        case State.ERROR:
            $("#allTopics").hide();
            $("#editLink").hide();
            $("#editor").hide();
            $("#chapterContent").hide();
            $("#topicContent").hide();
            $("#errorDetails").html(errorTechDetails);
            hideErrorDetails();
            $("#error").show();
            break;
        default:
            console.error("Invalid state: " + state);
            break;
    }
}

function clearChapterContent() {
    chapterName.value = "";
    $("#markdownInput").val("");
    render();
}
