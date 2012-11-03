window.sendDataTo = function(fn) {
	window.sendToPopup = fn;
};

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message == 'load script') {
		chrome.tabs.executeScript(null, { file: 'bookmarker-loader.js' });
		sendPopupMessage = sendResponse;
	} else if (request.message == 'send details') {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var json = JSON.parse(xhr.response);
				var username = json.username;
				request.data = JSON.parse(request.data);
				request.data.space = username;
				request.data = JSON.stringify(request.data);
				window.sendToPopup(request);
			}
		};
		xhr.open('GET', 'http://tiddlyspace.com/status', true);
		xhr.send();
	} else if (request.load) {
		chrome.tabs.executeScript(null, { file: request.load }, function() {
			sendResponse();
		});
	}
	return true;
});

chrome.browserAction.setPopup({ popup: 'bookmarker.html' });
