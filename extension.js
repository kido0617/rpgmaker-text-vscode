var vscode = require('vscode');
var window = vscode.window;
var workspace = vscode.workspace;
function activate(context) {
    var timeout = null;
    var activeEditor = window.activeTextEditor;
    var workspaceState = context.workspaceState;
    var settings = workspace.getConfiguration('rpgmakertext');

    var decorationBorder, decorationHighlight;
    init();
    if (activeEditor) {
        triggerUpdateDecorations();
    }

    context.subscriptions.push(vscode.commands.registerCommand('rpgmakertext.toggle', function () {
        settings.update('isEnable', !settings.get('isEnable'), true).then(function () {
            triggerUpdateDecorations();
        });
    }))

    window.onDidChangeActiveTextEditor(function (editor) {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    workspace.onDidChangeTextDocument(function (event) {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    workspace.onDidChangeConfiguration(function () {
        settings = workspace.getConfiguration('rpgmakertext');
        init();
        if (!settings.get('isEnable')) return;
        triggerUpdateDecorations();
    }, null, context.subscriptions);

    
    function init(){
        if(!settings.get("isEnable")){
            if(decorationBorder)decorationBorder.dispose();
            if(decorationHighlight)decorationHighlight.dispose();
            return;
        }
        decorationBorder = window.createTextEditorDecorationType({
            light:{
                borderColor: "#000",
            },
            dark: {
                borderColor: "#FFF",
            },
            borderStyle: "solid",
            borderWidth: "0 0 1px",
            isWholeLine: true
        })
        decorationHighlight = window.createTextEditorDecorationType({
            color: settings.get("highlightColor")
        });
    }

    function updateDecorations() {
        if (!activeEditor || !activeEditor.document) {
            return;
        }
        if (!settings.get('isEnable')) return;
        showBorder();
        highlightEscape();
    }

    function showBorder(){
        var lineCount = activeEditor.document.lineCount;
        var ranges = [];
        for(var i = 0; i < lineCount; i++){
            var text = activeEditor.document.lineAt(i).text;
            if(i % 4 == 3) ranges.push(new vscode.Range(i, 0, i, text.length));
        }
        activeEditor.setDecorations(decorationBorder, ranges);
    }

    function highlightEscape(){
        var text = activeEditor.document.getText();
        var ranges = [];
        var escapes = [
            "V\\[\\d+\\]",
            "N\\[\\d+\\]",
            "P\\[\\d+\\]",
            "G",
            "C\\[\\d+\\]",
            "I\\[\\d+\\]",
            "{",
            "}",
            "\\$",
            "\\.",
            "\\|",
            "!",
            ">",
            "<",
            "\\^",
            "\\\\"
        ];
        var regText = "";
        for(var i = 0; i < escapes.length; i++){
            regText += "\\\\" + escapes[i];
            if(i != escapes.length - 1) regText += "|";
        }
        var pattern = new RegExp(regText, ["g"]);
        var match;
        while (match = pattern.exec(text)) {
            var startPos = activeEditor.document.positionAt(match.index);
            var endPos = activeEditor.document.positionAt(match.index + match[0].length);
            ranges.push(new vscode.Range(startPos, endPos));
        }
        activeEditor.setDecorations(decorationHighlight, ranges);
    }

    function triggerUpdateDecorations() {
        timeout && clearTimeout(timeout);
        timeout = setTimeout(updateDecorations, 0);
    }
}
exports.activate = activate;
