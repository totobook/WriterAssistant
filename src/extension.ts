'use strict';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

export function activate(context: ExtensionContext) {
    console.log('Congratulations, your extension "WriterAssistant" is now active!');

    let wa = new WriterAssistant;    
    let disposable = commands.registerCommand('extension.writerAssistant', () => {
        wa.updateStatus();
    });
    // リソース開放設定
    context.subscriptions.push(wa);
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class WriterAssistant {
    private _statusBarItem: StatusBarItem;

    constructor() {
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    }

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
        if(doc.languageId === 'markdown' || doc.languageId === 'txt') {
            let word_count = this._getWordCount(doc);
            this._statusBarItem.text = `${word_count}文字`;
            this._statusBarItem.show();
        }
        else {
            this._statusBarItem.hide();
        }
    }

    // 文字数カウント（非ASCII文字以外が対象）
    private _getWordCount(doc: TextDocument): number {
        let count = 0;
        for (let i = 0; i < doc.lineCount; i++) {
            const line = doc.lineAt(i).text;
            if (line.length > 0 && line[0] !== '#') {
                for (let j = 0; j < line.length; j++) {
                    if (line.charCodeAt(j) > 127){ count++; }
                }
            }
        }
        return count;
    }

    // リソース開放用    
    dispose() {
        this._statusBarItem.dispose();
    }
}