chrome.runtime.onInstalled.addListener(function() {
  chrome.browserAction.onClicked.addListener(function() {
    new chrome.declarativeContent.ShowPageAction()
  });
});


chrome.runtime.onMessage.addListener(function(message:(string|{message?:string, fileName:string, url:string})){
 // console.log('RECIEVED MESSAGE', message);
  if (typeof message == 'string' && message == "__new_help_tab__"){
     chrome.tabs.create({ url: '/help.html'});
     return;
  }
  if (typeof message == 'string' && message == "__new_donation_tab__"){
    chrome.tabs.create({ url: 'https://www.buymeacoffee.com/quantleaf'});
    return;

  }
  const url = (message as {message:string, url:string}).url;
  const fileName = (message as {message:string, fileName:string}).fileName;

  if (url){
    chrome.downloads.download({
        filename: fileName,
        url: url // The object URL can be used as download URL
    });
    return;

}
});

