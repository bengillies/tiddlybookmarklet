/*
 * A new bookmarklet for TiddlySpace
 *
 * Use the following Bookmarklet to test:
 * javascript:(function(a,b)%7Ba=b.createElement('script');a.setAttribute('src','http://sandben.tiddlyspace.com/bookmarklet.js');b.body.appendChild(a);a.addEventListener('load',function()%7BloadBookmarker('http://sandben.tiddlyspace.com/bookmark','sandben');%7D,false);%7D(null,document))
 */

/*
 * @url: url of the bookmarklet
 * @space: space to save back to
 * @callback: callback to call when the window closes
 */
(function() {

var $; // make sure jQuery is mapped to $ internally

window.Bookmarker = {
	//load jQuery
	loadScript: function(url, testFn, callback) {
		if (!testFn()) {
			var scr = document.createElement('script');
			scr.type = 'text/javascript';
			scr.src = url;
			scr.onload = scr.onreadystatechange = function() {
				if (testFn()) {
					callback();
				}
			};
			document.body.appendChild(scr);
		} else {
			setTimeout(callback, 50);
		}
	},

	loadDependencies: function(callback) {
		var self = this;

		function jQueryTest() {
			return (typeof window.jQuery !== 'undefined');
		}

		function loadChrjs() {
			$ = jQuery;
			self.loadScript('http://tiddlyspace.com/bags/tiddlyspace/' +
				'tiddlers/chrjs', chrjsTest, callback);
		}

		function chrjsTest() {
			return (typeof window.tiddlyweb !== 'undefined' &&
				typeof window.tiddlyweb.Tiddler === 'function');
		}

		// load jQuery, then load chrjs
		this.loadScript('http://ajax.googleapis.com/ajax/libs/' +
			'jquery/1.6.4/jquery.min.js', jQueryTest, loadChrjs);
	},

	// init/constructor function
	load: function(url, space) {
		var self = this;

		this.bookmarkletID = 'bookmarklet' + this.randID;
		this.stylesheet.innerHTML = generateStylesheet(this.bookmarkletID);
		document.head.appendChild(this.stylesheet);
		this.urlBase = url.replace(/^(.*)([^\/])(\/[^\/].*)/,
			function($0, $1, $2) {
				return ($1) ? $1 + $2 : '';
			});

		this.loadDependencies(function() {
			var mover;

			$(document.body).append(this.stylesheet);
			self.iframe = $('<iframe/>', {
				src: url,
				id: self.bookmarkletID
			}).appendTo(document.body)[0];

			self.iframe.addEventListener('load', function() {
				var message = self.getMessage(space);
				self.iframe.contentWindow.postMessage(message, self.urlBase);
			}, false);

			mover = Mover($(self.iframe), self.urlBase, self.randID);
			window.addEventListener('message', function(event) {
				var message = JSON.parse(event.data);
				if (event.origin === self.urlBase &&
						message.id === self.randID) {
					switch (message.type) {
						case 'close':
							self.close();
							break;
						case 'startMove':
							mover.start(message.payload);
							break;
						case 'stopMove':
							mover.stop(message.diff);
							break;
					}
				}
			}, false);
		});
	},

	getText: function() {
		var text = '';
		if (window.getSelection) {
			text = window.getSelection().toString();
		} else if (document.getSelection) {
			text = document.getSelection();
		} else if (document.selection) {
			text = document.selection.createRange().text;
		} else {
			text = '';
		}

		return text;
	},

	getImages: function() {
		var images = [],
			candidates = document.getElementsByTagName('img'),
			res = [],
			i, l, image;

		for (i = 0, l = candidates.length; i < l; i++) {
			image = candidates[i];
			if ((image.offsetWidth >= 150 && image.offsetHeight >= 50)
					|| (image.offsetWidth >= 50 && image.offsetHeight >= 150)) {
				images.push(image);
			}
		}

		images = images.sort(function(a, b) {
			var aSize = a.offsetWidth * a.offsetHeight,
				bSize = b.offsetWidth * b.offsetHeight;

			return (aSize > bSize) ? -1 : ((aSize === bSize) ? 0 : 1);
		});

		for (i = 0, l = images.length; i < l; i++) {
			image = images[i];
			if (image.src) {
				res.push(image.src);
			}
		}

		return res;
	},

	getTitle: function() {
		return document.title.replace(/\|/g, '-');
	},

	getMessage: function(space) {
		return JSON.stringify({
			title: this.getTitle(),
			url: window.location.href,
			space: space,
			text: this.getText(),
			images: this.getImages(),
			id: this.randID
		});
	},

	close: function() {
		document.body.removeChild(this.iframe);
	},

	iframe: null,
	stylesheet: document.createElement('style'),
	randID: ('' + Math.random()).slice(2),
	bookmarkletID: null,
	urlBase: null

};

function generateStylesheet(uniqueID) {
	return [
		'#' + uniqueID + ' {',
		'width: 555px;',
		'height: 87%;',
		'max-height: 527px;',
		'min-height: 300px;',
		'position: fixed;',
		'top: 0;',
		'left: 0;',
		'bottom: 0;',
		'margin: 10% 25%;',
		'z-index: 10000;',
		'border: 0;',
		'}',
		'@media all and (min-width: 1360px) {',
		'#' + uniqueID + ' {',
		'margin: 10% 30%;',
		'}',
		'}',
		'@media all and (max-width: 800px) {',
		'#' + uniqueID + ' {',
		'margin: 10%;',
		'}',
		'}',
		'@media all and (max-width: 600px) {',
		'#' + uniqueID + ' {',
		'margin: 10% 5%;',
		'}',
		'}',
		'@media all and (max-width: 550px) {',
		'#' + uniqueID + ' {',
		'margin: 10% 0;',
		'width: 100%;',
		'}',
		'}'
	].join('\n');
}

function Mover($el, urlBase, randID) {
	var borderSize,
		oldCSS = {},
		devMode = /csrf_token=[0-9]{10}:bengillies/.test(document.cookie);

	return {
		start: function(payload) {
			var diff = { y: $el.offset().top, x: $el.offset().left };
			oldCSS.top = $el.offset().top;
			oldCSS.left = $el.offset().left;
			oldCSS.right = $el.css('right');
			oldCSS.bottom = $el.css('bottom');
			oldCSS.height = $el.css('height');
			oldCSS.width = $el.css('width');
			oldCSS['max-height'] = $el.css('max-height');
			oldCSS['max-width'] = $el.css('max-width');
			oldCSS.margin = $el.css('margin');
			$el.css({
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				margin: 0,
				width: '100%',
				height: '100%',
				'max-height': 'none',
				'max-width': 'none'
			});
			$el[0].contentWindow.postMessage(JSON.stringify({
				type: 'initMove',
				diff: diff,
				id: randID
			}), urlBase);
		},
		stop: function(diff) {
			$el.css({
				top: oldCSS.top + diff.y,
				left: oldCSS.left + diff.x,
				right: oldCSS.right,
				bottom: oldCSS.bottom,
				//margin: oldCSS.margin,
				height: oldCSS.height,
				width: oldCSS.width,
				'max-height': oldCSS['max-height'],
				'max-width': oldCSS['max-width']
			});
			$el[0].contentWindow.postMessage(JSON.stringify({
				type: 'doneMove',
				id: randID
			}), urlBase);
		}
	};
}

// check if we should run straight away
var scripts = document.getElementsByTagName('script');
for (var i = 0, l = scripts.length; i < l; i++) {
	var attribute = scripts[i].getAttribute('data-tiddlyspace-trigger-hack'),
		args;
	// if there's a script from tiddlyspace with the right attribute
	if (attribute) {
		args = JSON.parse(attribute);
		// remove the script when the bookmarklet closes
		args.push(function() {
			document.body.removeChild(scripts[i]);
		});
		Bookmarker.load.apply(Bookmarker, args);
		return;
	}
}

}());
