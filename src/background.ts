chrome.runtime.onInstalled.addListener(function() {

  chrome.browserAction.onClicked.addListener(function() {
    new chrome.declarativeContent.ShowPageAction()
  });
 

});

chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo) {
    if (changeInfo.url) {
      chrome.tabs.sendMessage( tabId, {
        message: '__new_url_ql__',
        url: changeInfo.url
      });
    }
  }
);




/*
const onDebuggerEnabled = (debuggeeId) => {
  debuggerEnabled = true
}

const onAttach = (debuggeeId) => {
chrome.debugger.sendCommand(
    debuggeeId, "Debugger.enable", {},
    onDebuggerEnabled.bind(null, debuggeeId));
}*/

chrome.runtime.onMessage.addListener(function(message:(string|{message?:string, fileName:string, url:string})){
 // console.log('RECIEVED MESSAGE', message);
  if (typeof message == 'string' && message == "__new_help_tab__"){
     chrome.tabs.create({ url: '/help.html'});
  }
  if (typeof message == 'string' && message == "__new_donation_tab__"){
    chrome.tabs.create({ url: 'https://www.buymeacoffee.com/quantleaf'});
  }
  const url = (message as {message:string, url:string}).url;
  const fileName = (message as {message:string, fileName:string}).fileName;

  if (url){
    chrome.downloads.download({
        filename: fileName,
        url: url // The object URL can be used as download URL
    });
  }
  else 
  {
    alert('Noting to download')
  }
  


 /* const keyEvent = message as {message:string, element, event}; 
  if (keyEvent.message == "__search_key__"){
      chrome.debugger.attach(keyEvent.element, "1.2", function() {
        chrome.debugger.sendCommand(keyEvent.element, "Input.dispatchKeyEvent", keyEvent.event)
    })
  }*/
});

