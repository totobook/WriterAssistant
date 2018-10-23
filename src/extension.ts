'use strict';
import {window, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem} from 'vscode';

export function activate(context: ExtensionContext) {
    let writeAssistant = new WriterAssistant;
    let controller      = new WriterAssistantController(writeAssistant);

    // リソース開放設定
    context.subscriptions.push(writeAssistant);
    context.subscriptions.push(controller);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class WriterAssistant {
    private _statusBarItem!: StatusBarItem;

    public updateStatus() {
        // 値がなければステータスバーの左側の情報を取得
        if(!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        // アクティブなエディタを取得
        let editor = window.activeTextEditor;
        if(!editor) {
            // 取得できなかった場合ステータスバーを非表示にして終了
            this._statusBarItem.hide();
            return;
        }

        // エディタ内のドキュメントを取得
        let doc = editor.document;
        if(doc.languageId === 'markdown') {
            let docContext = doc.getText();
            let wordCount  = this._getWordCount(docContext);
            let kanjiCount = this._getKanjiCount(docContext);
            this._statusBarItem.text = `$(pencil)${wordCount}文字  $(graph)漢字率${Math.round((kanjiCount / wordCount) * 100)}%`;
            this._statusBarItem.show();
        }
        else {
            this._statusBarItem.hide();
        }
    }

    // 文字数カウント
    private _getWordCount(docContent: string): number {
        // カウントに含めない文字を削除する
        docContent = docContent
            .replace(/\s/g, '') // すべての空白文字
            .replace(/\#/g, '')  // すべてのタイトル記号
            .replace(/《(.+?)》/g, '')  // ルビ範囲指定記号とその中の文字
            .replace(/[\|｜]/g, '');    // ルビ開始記号
        let characterCount = 0;
        if (docContent !== "") {
            characterCount = docContent.length;
        }
        return characterCount;
    }

    // テキスト中の漢字の出現数を表示
    private _getKanjiCount(docContent: string): number {
        return (docContent.match(/[\u4E00-\u9FFF\u3005-\u3006]/g) || []).length;
    }

    // リソース開放用
    dispose() {
        this._statusBarItem.dispose();
    }
}

class WriterAssistantController {
    private _writeAssistant: WriterAssistant;
    private _disposable: Disposable;

    constructor(wa: WriterAssistant) {
        this._writeAssistant = wa;
        this._writeAssistant.updateStatus();

        let subscriptions:Disposable[] = [];
        // カーソル位置変更時とアクティブエディタが変更されたときイベント起動
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._writeAssistant.updateStatus();
    }

    dispose() {
        this._disposable.dispose();
    }
}