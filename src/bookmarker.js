(function() {

	var details = {
		queue: [],
		set: function(target, data) {
			this[target] = data;
			this.done(target);
		},
		done: function(target) {
			var self = this;
			$.each(this.queue, function(i, obj) {
				if (obj.target === target) {
					obj.fn(self[target]);
				}
			});
		},
		when: function(target, func) {
			this.queue.push({
				target: target,
				fn: func
			});
			if (this[target]) {
				this.done(target);
			}
		}
	};
	
	function setFocus($el) {
		// use a setTimeout due to weirdness in chrome
		window.setTimeout(function() {
			$el.focus();

			// HACKY: changing the text forces the cursor to the end of the textarea
			var val = $el.val();
			$el.val('');
			$el.val(val);
		}, 0);
	}
	
	var tabs = {
		post: {
			populate: function(data) {
				$('#titleInputPost').val(data.title);
				$('#urlInputPost').val(data.url);
				var quoteTxt = data.text ? '> ' + data.text.split('\n').join('\n> ') : '';
				var txtEl = $('#textInputPost').val(quoteTxt).focus();
				setFocus(txtEl);
			},
			toTiddler: function() {
				var title = $('#titleInputPost').val(),
					url = $('#urlInputPost').val(),
					description = $('#textInputPost').val(),
					privOrPub = $('#privateInputPost:checked').length ? 'private' : 'public';
					tags = figureTags($('#tagsInputPost').val());
		
				var tiddler = new tiddlyweb.Tiddler(title);
				tiddler.fields = {
					url: url
				};
				tiddler.tags = tags;
				tiddler.privacy = privOrPub;
				tiddler.text = description;
				
				return tiddler;
			}
		},
		link: {
			populate: function(data) {
				$('#titleInputLink').val(data.title);
				$('#urlInputLink').val(data.url);
				var txtEl = $('#textInputLink').val(data.text).focus();
				setFocus(txtEl);
			},
			toTiddler: function() {
				var title = $('#titleInputLink').val(),
					url = $('#urlInputLink').val(),
					description = $('#textInputLink').val(),
					privOrPub = $('#privateInputLink:checked').length ? 'private' : 'public';
					tags = figureTags($('#tagsInputLink').val());
		
				var tiddler = new tiddlyweb.Tiddler(title);
				tiddler.fields = {
					url: url
				};
				tiddler.tags = tags;
				tiddler.privacy = privOrPub;
				tiddler.text = ['!URL', url, '', '!Description', description].join('\n');
				
				return tiddler;
			}
		},
		quote: {
			populate: function(data) {
				$('#titleInputQuote').val(data.title);
				$('#urlInputQuote').val(data.url);
				$('#quoteInputQuote').val(data.text);
				var txtEl = $('#textInputQuote').val('[[' + data.title.replace('|', '>')
					+ '|' + data.url + ']]');
				setFocus(txtEl);
			},
			toTiddler: function() {
				var title = $('#titleInputQuote').val(),
					url = $('#urlInputQuote').val(),
					quote = $('#quoteInputQuote').val(),
					notes = $('#textInputQuote').val(),
					privOrPub = $('#privateInputQuote:checked').length ? 'private' : 'public';
					tags = figureTags($('#tagsInputQuote').val());
		
				var tiddler = new tiddlyweb.Tiddler(title);
				tiddler.fields = {
					url: url
				};
				tiddler.tags = tags;
				tiddler.privacy = privOrPub;
				tiddler.text = ['<<<', quote, '<<<', notes].join('\n');
				
				return tiddler;
			}
		},
		image: {
			populate: function(data) {
				$('#titleInputImage').val(data.title);
				$('#urlInputImage').val(data.url);
				setImages('.imagePicker', data.images);
				var quotedText = (data.text) ? '\n\n> ' + data.text.replace('\n', '\n> ') : '';
				var txtEl = $('#textInputImage').val('[[' + data.title.replace('|', '>')
					+ '|' + data.url + ']]' + quotedText);
				setFocus(txtEl);
			},
			toTiddler: function() {
				var title = $('#titleInputImage').val(),
					url = $('#urlInputImage').val(),
					image = $('.imagePicker .current').attr('src'),
					notes = $('#textInputImage').val(),
					privOrPub = $('#privateInputImage:checked').length ? 'private' : 'public';
					tags = figureTags($('#tagsInputImage').val());
					
				var tiddler = new tiddlyweb.Tiddler(title);
				tiddler.fields = {
					url: url
				};
				tiddler.tags = tags;
				tiddler.privacy = privOrPub;
				tiddler.text = ['[img[' + image + ']]', notes].join('\n');
				
				return tiddler;
			}
		}
	};
	
	function setImages(selector, images) {
		$.each(images, function(i, img) {
			$('<img/>').attr('src', img)
				.css({
					'max-height': '90px',
					'max-width': '100px',
					display: 'inline-block'
				}).click(function() {
					$(this).siblings()
							.removeClass('current').end()
						.addClass('current');
				}).appendTo(selector);
		});
		
		$('img:first', selector).addClass('current');
	}
	
	function pickDefaultTab(data) {
		if (!data.text) {
			return 'link';
		} else {
			return 'quote';
		}
	}

	function receiveMessage(event) {
		details.set('data', JSON.parse(event.data));
		details.set('eventSrc', {
			origin: event.origin,
			source: event.source
		});
	}

	window.addEventListener('message', receiveMessage, false);

	function figureTags(tagString) {
		var brackets = /^\s*\[\[([^\]\]]+)\]\](\s*.*)/,
			whitespace = /^\s*([^\s]+)(\s*.*)/,
			match,
			rest = tagString,
			tags = [];

		match = brackets.exec(rest) || whitespace.exec(rest);
		while (match) {
			tags.push(match[1]);
			rest = match[2];
			match = brackets.exec(rest) || whitespace.exec(rest);
		}

		return tags;
	}

	function saveTiddler(tiddler, privOrPub, callback) {
		details.when('data', function(data) {
			tiddler.bag = new tiddlyweb.Bag(data.space + '_' + privOrPub, '/');
			tiddler.put(function() {
				callback(true);
			}, function(xhr, error, exc) {
				callback(false, error, exc);
			});
		});
	}

	function closePage(timeout) {
		window.setTimeout(function() {
			details.when('eventSrc', function(src) {
				src.source.postMessage('close', src.origin);
			});
		}, timeout || 0);
	}

	function getCurrentTab() {
		return $('.tabs .active').data('tab-name');
	}

	function saveBookmark(event) {
		var $form = $(this),
			$successBtn = $('[type="submit"]input');

		var tiddler = tabs[getCurrentTab()].toTiddler();

		$successBtn.val('Saving...')
			.addClass('disabled')
			.attr('disabled', 'disabled');

		$('.closeBtn').addClass('disabled')
			.attr('disabled', 'disabled');

		saveTiddler(tiddler, tiddler.privacy, function(success) {
			if (success) {
				$successBtn
					.val('Saved!')
					.removeClass('primary')
					.addClass('success');
				closePage(1000);
			} else {
				$successBtn
					.removeClass('disabled')
					.removeAttr('disabled')
					.removeClass('primary')
					.addClass('danger')
					.val('Error saving. Please try again');
			}
		});

		event.preventDefault();
		return false;
	}

$(function() {

	$('form').submit(saveBookmark);
	$('.closeBtn').click(closePage);

	details.when('data', function(data) {
		// some initialisation: if there are no images, remove the images tab
		if (data.images.length === 0) {
			$('#imageForm').remove();
			$('.tabs li').each(function(i, el) {
				if ($(el).data('tab-name') === 'image') {
					$(el).remove();
				}
			});
		}
		
		// figure out which tab we should start off on
		var tab = pickDefaultTab(data);
		
		// populate the tab with data when the user switches to it
		$('.tabs').delegate('li', 'click', function() {
			var tabName = $(this).data('tab-name');
			if (!tabs[tabName].toTiddler().title) {
				tabs[tabName].populate(data);
			}
		});
		
		// initialise the app by switching to the correct tab.
		$('.tabs li').each(function(i, el) {
			var $el = $(el);
			if ($el.data('tab-name') === tab) {
				$el.find('a').click();
				return false;
			}
		});
		
		// now display the container again
		$('#container').show();
	});

});
}());