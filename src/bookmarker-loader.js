/*
 * A new bookmarklet for TiddlySpace
 *
 * Use the following Bookmarklet to test:
 * javascript:(function(a,b)%7Ba=b.createElement('script');a.setAttribute('src','http://sandben.tiddlyspace.com/bookmarklet.js');b.body.appendChild(a);a.addEventListener('load',function()%7BloadBookmarker('http://sandben.tiddlyspace.com/bookmark','sandben');%7D,false);%7D(null,document))
 */

function loadBookmarker(url, space) {

	function getText() {
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
    }
    
    function getImages() {
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
    }

	var container = document.createElement('div'),
		iframe = document.createElement('iframe'),
		stylesheet = document.createElement('style'),
		randID = ('' + Math.random()).slice(2),
		bookmarkletID = 'bookmarklet' + randID,
		cloakID = 'cloak' + randID,
		style = [
			'#' + bookmarkletID + ' {',
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
			'#' + bookmarkletID + ' {',
			'margin: 10% 30%;',
			'}',
			'}',
			'@media all and (max-width: 800px) {',
			'#' + bookmarkletID + ' {',
			'margin: 10%;',
			'}',
			'}',
			'@media all and (max-width: 600px) {',
			'#' + bookmarkletID + ' {',
			'margin: 10% 5%;',
			'}',
			'}',
			'@media all and (max-width: 550px) {',
			'#' + bookmarkletID + ' {',
			'margin: 10% 0;',
			'width: 100%;',
			'}',
			'}',
			'#' + cloakID + ' {',
			'position: fixed;',
			'top: 0;',
			'bottom: 0;',
			'left: 0;',
			'right: 0;',
			'background-color: rgba(11, 18, 29, 0.6);',
			'z-index: 9999;',
			'}'
		].join('\n');
		urlBase = url.replace(/^(.*)([^\/])(\/[^\/].*)/,
				function($0, $1, $2) {
					return ($1) ? $1 + $2 : '';
				});

	function closeBookmarker() {
		document.body.removeChild(container);
	}

	stylesheet.innerHTML = style;
	document.body.appendChild(stylesheet);

	iframe.src = url;
	iframe.id = bookmarkletID;
	container.appendChild(iframe);

	container.id = cloakID;
	document.body.appendChild(container);

	iframe.addEventListener('load', function() {
		var message = JSON.stringify({
				title: document.title,
				url: window.location.href,
				space: space,
				text: getText(),
				images: getImages()
			});
		iframe.contentWindow.postMessage(message, urlBase);
	}, false);

	window.addEventListener('message', function(event) {
		if ((event.origin === urlBase) && (event.data === 'close')) {
				closeBookmarker();
		}
	}, false);

	container.addEventListener('click', function() {
		closeBookmarker();
	});
}