class Topic {
    constructor(topicKey) {
        this.topicKey = topicKey.replaceAll(".", " ");
        this.displayName = topicKey;
    }
}

const State = {
    TOPICS: "topics",
    TABLE_OF_CONTENTS: "table-of-contents",
    CHAPTER_DISPLAY_BUT_NOT_EDIT: "chapter-no-edit",
    CHAPTER_EDIT: "chapter-edit",
    CHAPTER_EDIT_FINISHED: "chapter-edit-finished",
    CHAPTER_EDIT_IN_PROGRESS: "chapter-edit-in-progress"
};

var errorDetailsVisible = true;
var currentTopic = null;
var currentChapter = null;

$(function () {
    const button = document.getElementById('open-file');
    button.addEventListener('click', async () => {
        const dirHandle = await window.showDirectoryPicker();
        await initApp(dirHandle)
    });
});

async function initApp(contentRootHandle) {
    state(State.TOPICS);
    var topicParam = getParameterByName("topic");
    var chapterParam = getParameterByName("chapter");
    var editParam = getParameterByName("edit");

    if (chapterParam) {
        downloadAndDisplayChapter(chapterParam, editParam && (editParam === "true"), true);
    } else if (topicParam) {
        downloadAndDisplayChapters(topicParam, editParam && (editParam === "true"), true);
    } else {
        await navToTopicList(contentRootHandle);
    }
}

//Navigation Methods
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function navToTopicList(contentRootHandle) {
    var topicListElem = document.createElement("ul");
    for await (const entry of contentRootHandle.values()) {
        if (entry.kind === "directory" && entry.name !== ".") {
            const displayName = entry.name.replaceAll(".", " ");
            var topicElem = document.createElement("li");
            topicElem.appendChild(createLinkWithOnClick(displayName, function () {
                downloadAndDisplayChapters(entry.name);
            }));
            topicListElem.appendChild(topicElem);
        }
    }
    var newTopicCreateForm = document.createElement("li");

    var newTopicNameLabel = document.createElement("label");
    newTopicNameLabel.setAttribute("for", "newTopicName");
    newTopicNameLabel.appendChild(document.createTextNode("Create a new topic with name: "));
    newTopicCreateForm.appendChild(newTopicNameLabel);

    var newTopicNameInput = document.createElement("input");
    newTopicNameInput.setAttribute("id", "newTopicName");
    newTopicNameInput.setAttribute("name", "newTopicName");
    newTopicCreateForm.appendChild(newTopicNameInput);

    var createNewTopicBtn = document.createElement("button");
    createNewTopicBtn.appendChild(document.createTextNode("Create"));
    createNewTopicBtn.onclick = function () {
        var form = {
            topicName: newTopicNameInput.value
        };

        createNewTopicBtn.setAttribute("disabled", true);

        var request = $.ajax({
            url: "__BASE_URL__/server/admin/insertTopic.php",
            type: "post",
            data: form
        });

        request.done(function (response, textStatus, jqXHR) {
            console.log("Successfully created a new topic chapter.");
            displayChapters(response);
        });

        request.fail(function (response, textStatus, jqXHR) {
            console.log("Topic posting failed.");
            state(State.ERROR,
                "Status: " + textStatus + "<br /> Response from server: " + response.responseText);
        });

        request.always(function () {
            createNewTopicBtn.setAttribute("disabled", false);
        });
    };

    newTopicCreateForm.appendChild(createNewTopicBtn);
    topicListElem.appendChild(newTopicCreateForm);
    appendAsOnlyChild("#topics", topicListElem);
    state(State.TOPICS);
}

function downloadAndDisplayChapters(topicChapterLink, edit) {
    if (typeof (edit) === 'undefined') edit = false;

    //Clear content previously displayed
    clearChapterContent();

    httpGetAsync(topicChapterLink, function (data) {
        var response = JSON.parse(data);
        displayChapters(response);

        if (edit) {
            appendChapter();
        }
    }, function (errResponse) {
        $("#permlink").attr("href", "__BASE_URL__/index.html");
        state(State.ERROR, "Error retrieving list of chapters. Response from " + topicChapterLink + ":\n" + errResponse);
    });
}

function displayChapters(topicResponse) {
    currentTopic = topicResponse.topic;
    currentChapter = null;

    var topicName = currentTopic.displayName;
    var topicKey = currentTopic.topicKey;

    var chapterList = topicResponse.chapters;
    updateTableOfContents(topicResponse.topic, chapterList);
    state(State.TABLE_OF_CONTENTS);
}

function downloadAndDisplayChapter(url, edit, updateTOC) {
    if (typeof (edit) === 'undefined') edit = false;
    if (typeof (updateTOC) === 'undefined') updateTOC = false;
    httpGetAsync(url, function (data) {
        var response = JSON.parse(data);
        displayChapter(response, edit, updateTOC);
    }, function (errResp) {
        $("#permlink").attr("href", "__BASE_URL__/index.html");
        state(State.ERROR, "Error retrieving chapter contents. Response from " + url + ":\n" + errResp);
    });
}

function displayChapter(response, edit, updateTOC) {
    if (typeof (edit) === 'undefined') edit = false;
    if (typeof (updateTOC) === 'undefined') updateTOC = false;

    currentChapter = response.chapter;
    currentTopic = response.chapter.topic;
    chapterName.value = currentChapter.displayName;
    var content = response.content;
    $("#markdownInput").val(content);
    render();

    if (!edit) {
        state(State.CHAPTER_DISPLAY_BUT_NOT_EDIT);
    } else {
        state(State.CHAPTER_EDIT);
    }

    if (updateTOC) {
        updateTableOfContents(response.chapter.topic, response.allChapters);
    }
}

function appendChapter() {
    currentChapter = null;
    clearChapterContent();
    state(State.CHAPTER_EDIT);
}

//End: Navigation Methods

//Helper Methods

function updateTableOfContents(topic, chapterList) {
    console.log(JSON.stringify(topic));
    appendAsOnlyChild("#heading", document.createTextNode("Apoorv's Notes on " + topic.displayName));

    var chapterListElems = document.createElement("ol");
    jQuery.each(chapterList, function (index, chapter) {
        console.log(JSON.stringify(chapter));
        var liElem = document.createElement("li");
        liElem.appendChild(createLinkWithOnClick(chapter.displayName, function () {
            downloadAndDisplayChapter(chapter.links["get_content"]);
        }));
        chapterListElems.appendChild(liElem);
    });

    var appendNewChapterElem = document.createElement("li");
    appendNewChapterElem.appendChild(createLinkWithOnClick("Append", function () {
        appendChapter();
    }));
    appendNewChapterElem.appendChild(document.createTextNode(" a new chapter on this topic."));
    chapterListElems.appendChild(appendNewChapterElem);

    appendAsOnlyChild("#chapters", chapterListElems);
}

function httpGetAsync(theUrl, callback, errorCallback = null) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                callback(xmlHttp.responseText);
            } else if (errorCallback) {
                errorCallback(xmlHttp.response);
            }
        }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function convertTopicToFriendlyName(topicInternalName) {
    return topicInternalName.split(".").join(" ");
}

function convertTopicToInternalName(topicInternalName) {
    return topicInternalName.split(" ").join(".");
}

function createLinkWithHref(content, href) {
    var linkElem = document.createElement("a");
    linkElem.appendChild(document.createTextNode(content));
    linkElem.href = href;
    return linkElem;
}

function createLinkWithOnClick(content, onclickCallback) {
    var linkElem = document.createElement("a");
    linkElem.appendChild(document.createTextNode(content));
    linkElem.onclick = onclickCallback;
    return linkElem;
}

function appendAsOnlyChild(selector, childElem) {
    $(selector).empty();
    $(selector).append(childElem);
}

function showEditor() {
    $("#editor").show();
    $("#editLink").hide();
    if (currentChapter) {
        $("#permlink").attr("href", "__BASE_URL__/index.html?chapter=" + encodeURIComponent(currentChapter.links["get_content"]) + "&edit=true");
    } else if (currentTopic) {
        $("#permlink").attr("href", "__BASE_URL__/index.html?topic=" + encodeURIComponent(currentTopic.links["get_chapters"]) + "&edit=true");
    }
}

function hideEditor() {
    $("#editor").hide();
    $("#editLink").show();
    if (currentChapter) {
        $("#permlink").attr("href", "__BASE_URL__/index.html?chapter=" + encodeURIComponent(currentChapter.links["get_content"]));
    } else if (currentTopic) {
        $("#permlink").attr("href", "__BASE_URL__/index.html?topic=" + encodeURIComponent(currentTopic.links["get_chapters"]));
    }
}

function render() {
    var markdownInput = document.getElementById("markdownInput");
    var underScoreEscapedMarkdown = replaceAll($("#markdownInput").val(), "_", "\\_");
    var parsedHTML = markdown.toHTML(underScoreEscapedMarkdown);
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

function upsertChapter() {
    var form = {
        markdown: markdownInput.value,
        topicKey: currentTopic.topicKey,
        chapterName: chapterName.value
    };

    if (currentChapter) {
        form.chapterKey = currentChapter.chapterKey;
    }

    state(State.CHAPTER_EDIT_IN_PROGRESS);

    var request = $.ajax({
        url: "__BASE_URL__/server/admin/insert.php",
        type: "post",
        data: form
    });

    request.done(function (response, textStatus, jqXHR) {
        console.log("Successfully posted chapter.");
        displayChapter(response, false, true);
    });

    request.fail(function (response, textStatus, jqXHR) {
        console.log(response);
        state(State.ERROR, "Chapter posting failed.\n" + response);
    });

    request.always(function () {
        state(State.CHAPTER_EDIT_FINISHED);
    });
}

function cancelEditChapter() {
    //Whenever we next go into edit mode; we will enable these buttons
    $("#finishEdit").prop('disabled', true);
    $("#cancelEdit").prop('disabled', true);
    if (currentChapter) {
        downloadAndDisplayChapter(currentChapter.links["get_content"]);
    } else if (currentTopic) {
        downloadAndDisplayChapters(currentTopic.links["get_chapters"]);
    } else {
        navToTopicList();
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

//End: Helper Methods

//Courtesy: https://github.com/mathjax/MathJax-examples/blob/master/MathJax-base/sample-dynamic-2.html
var Preview = {
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
};
//
//  Cache a callback to the CreatePreview action
//
Preview.callback = MathJax.Callback(["CreatePreview", Preview]);
Preview.callback.autoReset = true; // make sure it can run more than once
