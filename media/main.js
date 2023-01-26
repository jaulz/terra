const vscode = acquireVsCodeApi();

const openCode = (path,line) => {
  vscode.postMessage({
    command: 'code',
    parameters : {
      path,line
    }
  })
};

const clearAll = () => {
  document.getElementById('logs').innerHTML = '';
}

const  setInnerHTML = function(element, html) {
  element.innerHTML = html;
  Array.from(element.querySelectorAll("script")).forEach( oldScript => {
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes)
      .forEach(attr => newScript.setAttribute(attr.name, attr.value));
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

// Wait for messages from extension
window.addEventListener('message', event => {
  const message = event.data

  switch (message.command) {
      case 'start':
        start()
        break;

      case 'stop':
        stop()
        break;
  }
});


let socket = null
const start = () => {
  const script = document.createElement('script');
  script.onload =  () => {
    if (socket) {
      return
    }
  
    // Wait for messages from debug server
     socket = io(`http://localhost:${window.port}`)
     socket.on('log', ({ uuid, payloads, meta }) => {
    console.group(uuid)
    console.log(meta)
    console.table(payloads)
    console.groupEnd()

       debugger
       const container = document.createElement('div');
       container.id = uuid

       for (const payload of payloads ) {
        const item = document.createElement('div');

        const type = document.createElement('div');
        type.innerHTML = payload.type
        item.appendChild(type);

        const main = document.createElement('div');

        // Type could be: log
        switch (payload.type) {
          default: {
            const content = document.createElement('div');
            content.innerHTML = JSON.stringify(payload.content)
            main.appendChild(content);

            const origin = document.createElement('div');
            const link = document.createElement('a')
            link.innerHTML = `${payload.origin.function_name}@${payload.origin.file}:${payload.origin.line_number}`
            link.href = '#'
            link.onclick = () => {
              vscode.postMessage({
                command: 'code',
                parameters : {
                  path: payload.origin.file,
                  line: payload.origin.line_number,
                }
              })
            }
            origin.appendChild(link);
            main.appendChild(origin);
          }
        }
        item.appendChild(main);

        container.appendChild(item);
       }
     
         document.getElementById('logs').appendChild(container);
         window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
     });
  }
  script.onerror = (error) => {
    console.error(error)
  }
  script.src = `http://localhost:${window.port}/socket.io/socket.io.js`;
  document.head.appendChild(script);
}

const stop = () => {
  socket?.close()
}