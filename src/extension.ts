import { ExtensionContext, workspace, window, commands } from 'vscode';
import Server from './Server'
import StatusBar from './StatusBar';
import Panel from './Panel';

export async function  activate(context: ExtensionContext) {
	const port = 3000

	// Register panel
	const panel = new Panel(context.extensionUri, port);
	context.subscriptions.push(
		window.registerWebviewViewProvider(Panel.viewType, panel));

	// Register status bar
	const statusBar = new StatusBar()
	context.subscriptions.push(statusBar);

	// Initialize server
	const server = new Server({
		port,
		log: (message) => {
			window.showInformationMessage(message)
		},
		onMessage: (message) => {
			window.showInformationMessage(message)
		},
		onStatusChange: (listening) => {
			if (listening) {
				statusBar.started()
				panel.start()
			} else {
				statusBar.stopped()
				panel.stop()
			}
		}
	})

	// Register commands
	const startCommand = commands.registerCommand('terra.start', () => {
		server.start()
	});
	context.subscriptions.push(startCommand);

	const stopCommand = commands.registerCommand('terra.stop', () => {
		server.stop()
	});
	context.subscriptions.push(stopCommand);

	const restartCommand = commands.registerCommand('terra.restart', () => {
		server.stop()
		server.start()
	});
	context.subscriptions.push(restartCommand);
}

export async function deactivate() {}
