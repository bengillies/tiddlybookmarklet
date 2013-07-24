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

function getData() {
	return {
		text: getText(),
		images: getImages()
	};
}

self.port.on('data', function() {
	let data = getData();

	self.port.emit('data', data);
});
