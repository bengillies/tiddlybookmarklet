var Widget = require('sdk/widget').Widget,
	Panel = require('sdk/panel').Panel,
	Request = require('sdk/request').Request,
	tabs = require('sdk/tabs'),
	prefs = require('sdk/simple-prefs').prefs,
	self = require('sdk/self');

var panel = Panel({
	width: 500,
	height: 500,
	contentURL: 'about:blank',
	contentScriptFile: self.data.url('bookmarker.js'),
	onHide: function() {
		panel.contentURL = 'about:blank';
	}
});

function getData(fn) {
	let tab = tabs.activeTab.attach({
		contentScriptFile: self.data.url('bookmarker-content.js')
	});

	function receiver(data) {
		fn(data);
		tab.removeListener('data', receiver);
	}

	tab.port.on('data', receiver);
	tab.port.emit('data');
}

panel.on('show', function() {
	Request({
		url: 'http://tiddlyspace.com/status',
		headers: { Accept: 'application/json' },
		onComplete: function(response) {
			if (response.status == 200) {
				let space = prefs.spaceName || response.json.username;

				getData(function(data) {
					panel.port.emit('bookmark-data', {
						space: space,
						url: tabs.activeTab.url,
						title: tabs.activeTab.title.replace(/\|/g, ' - '),
						text: data.text,
						images: data.images
					});
				});
			}
		}
	}).get()
});

panel.port.on('save', function(data) {
	let url = 'http://tiddlyspace.com/bags/' + encodeURIComponent(data.bag) +
		'/tiddlers/' + encodeURIComponent(data.title);

	Request({
		url: url,
		content: JSON.stringify(data.tiddler),
		contentType: 'application/json',
		onComplete: function(response) {
			if (response.status == 204) {
				panel.port.emit('save', { saved: true });
			} else {
				panel.port.emit('save', { saved: false });
			}
		}
	}).put()
});

panel.port.on('close', function() {
	panel.hide();
});

var widget = Widget({
	id: 'bookmarker',
	label: 'Save to TiddlySpace',
	contentURL: self.data.url('icon-16.png'),
	panel: panel,
	onClick: function() {
		panel.contentURL = self.data.url('bookmarker.html');
	}
});
