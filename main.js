import * as fs from "./lib/fs.js";
import * as markdown from "./lib/markdown.min.js";

const State = {
    TOPICS: "topics",
    TABLE_OF_CONTENTS: "table-of-contents",
    CHAPTER_DISPLAY_BUT_NOT_EDIT: "chapter-no-edit",
    CHAPTER_EDIT: "chapter-edit",
    CHAPTER_EDIT_FINISHED: "chapter-edit-finished",
    CHAPTER_EDIT_IN_PROGRESS: "chapter-edit-in-progress"
}

const Preview = {
    delay: 150, // delay after keystroke before updating
    preview: null, // filled in by Init below
    buffer: null, // filled in by Init below
    timeout: null, // store setTimout id
    mjRunning: false, // true when MathJax is processing
    mjPending: false, // true when a typeset has been queued
    oldText: null, // used to check if an update is needed
    //
    //  Get the preview and buffer DIV's
    //
    Init: function () {
        this.preview = document.getElementById("displayArea2");
        this.buffer = document.getElementById("displayArea1");

        $("#displayArea1").show();
        $("#displayArea2").hide();
    },
    //
    //  Switch the buffer and preview, and display the right one.
    //
    SwapBuffers: function () {
        var buffer = this.preview,
            preview = this.buffer;
        this.buffer = buffer;
        this.preview = preview;
        $("#" + this.buffer.id).hide();
        $("#" + this.preview.id).show();
    },
    //
    //  This gets called when a key is pressed in the textarea.
    //  We check if there is already a pending update and clear it if so.
    //  Then set up an update to occur after a small delay (so if more keys
    //    are pressed, the update won't occur until after there has been 
    //    a pause in the typing).
    //  The callback function is set up below, after the Preview object is set up.
    //
    Update: function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(this.callback, this.delay);
    },
    //
    //  Creates the preview and runs MathJax on it.
    //  If MathJax is already trying to render the code, return
    //  If the text hasn't changed, return
    //  Otherwise, indicate that MathJax is running, and start the
    //    typesetting.  After it is done, call PreviewDone.
    //  
    CreatePreview: function () {
        Preview.timeout = null;
        if (this.mjPending) {
            return;
        }
        var text = document.getElementById("parsedMarkdown").innerHTML;
        if (text === this.oldtext) {
            return;
        } else if (this.mjRunning) {
            this.mjPending = true;
            MathJax.Hub.Queue(["CreatePreview", this]);
        } else {
            this.buffer.innerHTML = this.oldtext = text;
            this.mjRunning = true;
            MathJax.Hub.Queue(
                ["Typeset", MathJax.Hub, this.buffer], ["PreviewDone", this]
            );
        }
    },
    //
    //  Indicate that MathJax is no longer running,
    //  and swap the buffers to show the results.
    //
    PreviewDone: function () {
        this.mjRunning = this.mjPending = false;
        this.SwapBuffers();
    }
}

var errorDetailsVisible = true;
var currentTopic = null;
var currentChapter = null;

$(function () {
    const button = document.getElementById('open-file');
    state(State.TOPICS);
    button.addEventListener('click', async () => {
        const dirHandle = await window.showDirectoryPicker();
        await createTopicList(dirHandle);
        initApp();
    });
});

function initApp() {
    Preview.callback = MathJax.Callback(["CreatePreview", Preview]);
    Preview.callback.autoReset = true; // make sure it can run more than once
    Preview.Init();
}

function createListItem(displayText, linkAction) {
    const listItem = document.createElement("li");
    if (linkAction) {
        const linkElem = document.createElement("a");
        linkElem.appendChild(document.createTextNode(displayText));
        linkElem.onclick = linkAction;
        listItem.appendChild(linkElem);
    }
    return listItem;
}


async function createTopicList(contentRootHandle) {
    const topicListElem = document.createElement("ul");
    const topics = await fs.getTopics(contentRootHandle);
    for (const topic of topics) {
        topicListElem.appendChild(createListItem(
            topic.displayName,
            async () => displayTopic(contentRootHandle, topic)));
    }

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
    appendAsOnlyChild("#heading", document.createTextNode("Apoorv's Notes on " + topic.displayName));
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
    var parsedHTML = underScoreEscapedMarkdown;
    $("#parsedMarkdown").html(parsedHTML);
    Preview.Update();
}

function increaseInputFontSize() {
    var currFontSize = parseInt($('#markdownInput').css("font-size").replace("px", ""));
    $('#markdownInput').css("font-size", (currFontSize + 1) + "px");
}

function decreaseInputFontSize() {
    var currFontSize = parseInt($('#markdownInput').css("font-size").replace("px", ""));
    $('#markdownInput').css("font-size", (currFontSize - 1) + "px");
}

function cancelEditChapter() {
    //Whenever we next go into edit mode; we will enable these buttons
    $("#finishEdit").prop('disabled', true);
    $("#cancelEdit").prop('disabled', true);
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
    if (typeof (errorTechDetails) === 'undefined') errorTechDetails = "No technical details available.";
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
            $("#finishEdit").prop('disabled', false);
            $("#cancelEdit").prop('disabled', false);
            $("#error").hide();
            showEditor();
            break;
        case State.CHAPTER_EDIT_FINISHED:
            $("#finishEdit").prop('disabled', false);
            $("#cancelEdit").prop('disabled', false);
            break;
        case State.CHAPTER_EDIT_IN_PROGRESS:
            $("#finishEdit").prop('disabled', true);
            $("#cancelEdit").prop('disabled', true);
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
