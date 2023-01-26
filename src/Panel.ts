import { window, Uri, ViewColumn, WebviewPanel, ExtensionContext, workspace, Selection, commands, Disposable, WebviewViewProvider, WebviewView, WebviewViewResolveContext, CancellationToken, Webview } from 'vscode'

export default class Panel implements WebviewViewProvider {
  public static readonly viewType = 'terra.panel';

private view?:WebviewView

constructor(
  private readonly extensionUri: Uri,
  private readonly port: number
) { }

    public resolveWebviewView(
      webviewView: WebviewView,
      context: WebviewViewResolveContext,
      _token: CancellationToken,
    ) {
      this.view = webviewView;
  
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [
          this.extensionUri
        ]
      };
      
      webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
  
      webviewView.webview.onDidReceiveMessage(payload => {
        debugger
        const { command, parameters} = payload

        switch (command) {
          case 'code':
            this.openCode(parameters.path,parameters.line)
            return;
        }
      });
    }

    postMessage(command:string, parameters: Record<string, any> = {}) {
      this.view?.webview.postMessage({
        command,
        parameters,
      })
    }

    start() {
      this.postMessage('start')
    }

    stop() {
      this.postMessage('stop')
    }

    close() {
			window.showInformationMessage('close')
          commands.executeCommand('terra.stop');
    }

    async openCode(path:string, line: number) {
        const setting =Uri.parse(path);

        workspace.openTextDocument(setting).then((textDocument) => {
            window.showTextDocument(textDocument, 1, false).then(editor => {
                const {range} = editor.document.lineAt(line - 1);

                editor.selection = new Selection(range.start, range.end);
                editor.revealRange(range);
            });
        }, (error) => {
            console.error(error);
        });
    }

    resolveAssetPath(webview: Webview, ...path: string[]) {
        const pathOnDisk = Uri.joinPath(this.extensionUri, 'media', ...path);

        return webview.asWebviewUri(pathOnDisk);
    }

    getHtmlForWebview(webview: Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = this.resolveAssetPath(webview, 'main.js')

		// Do the same for the stylesheet.
		const styleResetUri = this.resolveAssetPath(webview, 'reset.css')
		const styleVSCodeUri = this.resolveAssetPath(webview, 'vscode.css')
		const styleMainUri = this.resolveAssetPath(webview, 'main.css')

		// Use a nonce to only allow a specific script to be run.
		const nonce = this.getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}' http://localhost:${this.port}; connect-src ws://localhost:${this.port} http://localhost:${this.port};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
          window.port = ${this.port}
        </script>
				<title>Terra</title>
			</head>
			<body>
        <div id="logs" />

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }

    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}