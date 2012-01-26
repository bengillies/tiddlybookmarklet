(function() {
	// we only want to run this once but the click handler seems to run twice
	var id = 'tiddlybookmark-loader';

	// find out who the user is
	// and load up the bookmarklet, setting the attributes that it should call
	// itself with. This is needed as we can't use postMessage on iframes
	// from this script directly.
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		var res = JSON.parse(xhr.responseText),
			username = res.username,
			spaceuri = 'http://' + username + '.tiddlyspace.com/bookmarker';

		var el = document.getElementById(id);
		if (el) {
			return;
		}

		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.id = id;
		script.src = 'http://bookmarksplugin.tiddlyspace.com/bookmarker-loader.js';
		script.setAttribute('data-tiddlyspace-trigger-hack', JSON.stringify([
			spaceuri,
			username
		]));

		document.body.appendChild(script);
	};
	xhr.open("GET", 'http://tiddlyspace.com/status', true);
	xhr.send();
}());
