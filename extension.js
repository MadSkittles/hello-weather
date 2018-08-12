const { StatusBarAlignment, window, commands } = require('vscode');
const { basename, extname } = require('path');
const GitHubService = require('./githubService');

let statusBarUI, githubService;

function statusWork(msg = '', show = true) {
    statusBarUI.text = msg;
    statusBarUI.tooltip = '';
    statusBarUI.command = null;
    if (show) {
        statusBarUI.show();
    } else {
        statusBarUI.hide();
    }
}

function showUploadStatus() {
    statusWork('$(sync) snippets uploading ...');
}

function showUploadSuccessStatus() {
    statusWork('$(thumbsup) snippets uploaded');
}

function showUploadFailureStatus() {
    statusWork('$(thumbsdown) oops, something wrong!!');
}

function hideStatus() {
    statusWork('', false);
}

async function getContent() {
    const editor = window.activeTextEditor;
    let selection = editor.selection;
    if (selection.isEmpty) {
        throw new Error('$(thumbsdown) nothing to upload');
    }
    return selection.isEmpty ? '' : editor.document.getText(selection);
}

async function upload() {
    showUploadStatus();
    try {
        let content = await getContent();
        let filePath = window.activeTextEditor.document.fileName;
        let ext = extname(filePath);
        let fileName = basename(filePath, ext);
        let currentTime = new Date();
        let uploadFileName = `${fileName}-${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDay()}-${currentTime.getHours()}-${currentTime.getMinutes()}-${currentTime.getSeconds()}${ext}`;

        let options = {
            ignoreFocusOut: true,
            value: uploadFileName,
            placeHolder: 'Input a name for uploading',
            prompt: 'Input a name for uploading'
        };
        let realUploadFileName = await window.showInputBox(options);
        if (realUploadFileName) {
            let res = await githubService.uploadSnippet(
                realUploadFileName,
                content
            );
            if (res) {
                showUploadSuccessStatus();
            } else {
                showUploadFailureStatus();
            }
        }
    } catch (err) {
        statusWork(err.message);
    } finally {
        setTimeout(() => {
            hideStatus();
        }, 3000);
    }
}

function activate(context) {
    console.log('Congratulations, your extension "hello" is now active!');

    statusBarUI = window.createStatusBarItem(StatusBarAlignment.Left, 1);
    context.subscriptions.push(statusBarUI);

    githubService = new GitHubService(
        '7c40e897793d9e7ea2d595169440f45304518f83'
    );

    context.subscriptions.push(
        commands.registerCommand('extension.sayHello', () => {
            upload();
        })
    );
}

exports.activate = activate;

function deactivate() {
    statusBarUI.dispose();
}
exports.deactivate = deactivate;
