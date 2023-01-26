import { Disposable,StatusBarAlignment,StatusBarItem,window } from 'vscode'

export default class StatusBar extends Disposable {
  item: StatusBarItem

  constructor() {
      super(() => this.item.dispose());

      this.item = window.createStatusBarItem(StatusBarAlignment.Right,10)
      this.stopped();
  }

  started() {
      this.item.command = 'terra.stop'
      this.item.text = '$(debug) Stop Terra'
      this.item.show();
  }

  stopped() {
      this.item.command = 'terra.start'
      this.item.text = '$(bug) Start Terra'
      this.item.show();
  }
}