'use strict';

var Deckard = function (container, config) {
	var self = this;
	container = $(container);
	var items = $(container).children();

	var defaultConfig = {
		enablePagination: true,
		enableNavigation: true,
		framesPerFilmstrip: 10,
		initialSlideIndex: 0
	}

	//Fold the default configuration into the supplied configuration, to fill in any gaps
	if (config || (typeof config == 'object' && !(config instanceof Array))) {
		for (var c in defaultConfig) {
			if (!config.hasOwnProperty(c)) {
				config[c] = defaultConfig[c];
			}
		}
	} else {
		config = defaultConfig;
	}

	if (items.length) {
		//Get the slide dimensions to fit everything around
		var dim = {
			width: Math.round(parseInt($(items).first().css('width'), 10)),
			height: Math.round(parseInt($(items).first().css('height'), 10))
		};
		
		//Calculate filmstrip frame sizes
		var frameWidth = Math.round(((dim.width - (config.framesPerFilmstrip - 1) * 10) / config.framesPerFilmstrip)); // (x-1)*10: take into account x-1 right margins; /x: want to fit x frames;
		var frameHeight = Math.round(dim.height * (frameWidth / dim.width)); // Apply the scale factor from frameWidth to frameHeight, to maintain proportions
		
		//Calculate filmstrip quantity (crumbtrail page quantity)
		var filmstripTotal = Math.ceil(items.length / config.framesPerFilmstrip);
		//TODO: work out if pages overflow width of stage or not, if not, apply centering.
		var crumbtrailTotal = Math.ceil(((filmstripTotal * 10) + ((filmstripTotal - 1) * 20)) / dim.width);
		var crumbtrailWidth = Math.min(dim.width, (filmstripTotal * 10) + ((filmstripTotal - 1) * 20));

		//Write the markup
		var markup = '';
		var presentation = '';
		var navigation = '';
		var pagination = '';
		items.each(function (index, item) {
			presentation += '<div id="" class="slide-outer">';
	    	presentation += 	'<div id="" class="slide-inner" style="height:' + dim.height + 'px; width:' + dim.width + 'px;">';
    		presentation += 		this.outerHTML;
    		presentation += '</div>';
	    	presentation += 	'</div>';

	    	navigation += 	'<div id="" class="frame-outer">';
	    	navigation += 		'<div id="" class="frame-inner" style="height:' + frameHeight + 'px; width:' + frameWidth + 'px;">';
	    	navigation += 			'<div class="content" title="' + $(item).attr('deckard-slide-label') + '">' + $(item).attr('deckard-slide-label') + '</div>';
	    	navigation += 		'</div>';
	    	navigation += 	'</div>';
		});
		for (var i = 0; i < filmstripTotal; i++) {
			pagination += 	'<div id="" class="crumb-outer">';
	    	pagination += 		'<div id="" class="crumb-inner">';
	    	pagination += 			'<div class="content"></div>';
	    	pagination += 		'</div>';
	    	pagination += 	'</div>';
		}
		//Write curtains, stage, and belt around items and supply dimensions
		markup +=	'<div id="" class="pagination" style="' + (crumbtrailTotal === 1 ? 'margin: 0 auto;' : '') + ' display:none;">';
		markup +=		'<div id="" class="curtain curtain-left"></div>';
		markup +=		'<div id="" class="stage" style="width:' + crumbtrailWidth + 'px;">';
		markup +=			'<div id="" class="firefox-stage">';
		markup +=				'<div id="" class="belt crumbtrail">';
		markup +=					pagination;
		markup +=				'</div>';
		markup +=			'</div>';
		markup +=		'</div>';
		markup +=		'<div id="" class="curtain curtain-right"></div>';
		markup +=	'</div>';
		markup +=	'<div id="" class="navigation" style="display:none;">';
		markup +=		'<div id="" class="curtain curtain-left"></div>';
		markup +=		'<div id="" class="stage" style="height:' + frameHeight + 'px;width:' + dim.width + 'px;">';
		markup +=			'<div id="" class="firefox-stage">';
		markup +=				'<div id="" class="belt filmstrip">';
		markup +=					navigation;
		markup +=				'</div>';
		markup +=			'</div>';
		markup +=		'</div>';
		markup +=		'<div id="" class="curtain curtain-right"></div>';
		markup +=	'</div>';
		markup +=	'<div id="" class="presentation" style="display:none;">';
		markup +=		'<div id="" class="curtain curtain-left"></div>';
		markup +=		'<div id="" class="stage" style="height:' + dim.height + 'px; width:' + dim.width + 'px;">';
		markup +=			'<div id="" class="firefox-stage">';
		markup +=				'<div id="" class="belt slidedeck">';
		markup +=					presentation;
		markup +=				'</div>';
		markup +=			'</div>';
		markup +=		'</div>';
		markup +=		'<div id="" class="curtain curtain-right"></div>';
		markup +=	'</div>';
		
		//Overwrite with new markup
		$(container).html(markup);

		self.slidedeck = {
			el: $(container).find('.presentation .slidedeck'),
			total: items.length,
			current: 1,
			size: 1,
			isEnabled: true,
			toString: function () { return 'slidedeck'; }
		};
		self.filmstrip = {
			el: $(container).find('.navigation .filmstrip'),
			total: filmstripTotal,
			current: 1,
			size: 10,
			isEnabled: true,
			toString: function () { return 'filmstrip'; }
		};
		self.crumbtrail = {
			el: $(container).find('.pagination .crumbtrail'),
			total: crumbtrailTotal,
			current: 1,
			size: Math.ceil(dim.width / 30),
			isEnabled: true,
			toString: function () { return 'crumbtrail'; }
		};

		Deckard.mediator.register(self.slidedeck);
		Deckard.mediator.register(self.filmstrip);
		Deckard.mediator.register(self.crumbtrail);

		var trackMoveFactory = function (stream) {
			return function (event, data) {
				if (event === 'move') {
					$(stream.el[0].childNodes).find('.selected').removeClass('selected');
					self.move(stream)(Math.floor((data.current-1) / stream.size));
					$(stream.el[0].childNodes[data.current-1].firstChild).addClass('selected');
				}
			};
		};

        // Filmstrip needs to listen to the slidedeck
		Deckard.mediator.subscribe(self.slidedeck, null, trackMoveFactory(self.filmstrip));
		// Crumbtrail needs to listen to the filmstrip
		Deckard.mediator.subscribe(self.filmstrip, null, trackMoveFactory(self.crumbtrail));
		
		//Attach move handlers
		$(container).find('.presentation .curtain-right').on('click', function () { self.move(self.slidedeck)('left'); });
		$(container).find('.presentation .curtain-left').on('click', function () { self.move(self.slidedeck)('right'); });

		$(container).find('.navigation .curtain-right').on('click', function () { self.move(self.filmstrip)('left'); });
		$(container).find('.navigation .curtain-left').on('click', function () {self. move(self.filmstrip)('right'); });

		$(container).find('.pagination .curtain-right').on('click', function () { self.move(self.crumbtrail)('left'); });
		$(container).find('.pagination .curtain-left').on('click', function () { self.move(self.crumbtrail)('right'); });

		$(container).find('.presentation').on('swiperight', function () { self.move(self.slidedeck)('right'); });
		$(container).find('.presentation').on('swipeleft', function () { self.move(self.slidedeck)('left'); });

		$(container).find('.navigation').on('swiperight', function () { self.move(self.filmstrip)('right'); });
		$(container).find('.navigation').on('swipeleft', function () { self.move(self.filmstrip)('left'); });

		$(container).find('.pagination').on('swiperight', function () { self.move(self.crumbtrail)('right'); });
		$(container).find('.pagination').on('swipeleft', function () { self.move(self.crumbtrail)('left'); });

		$(container).find('.pagination .stage .belt .crumb-outer').on('click', function (e) {
			self.move(self.filmstrip)($(this).index());
		});
		$(container).find('.navigation .stage .belt .frame-outer').on('click', function (e) {
			self.move(self.slidedeck)($(this).index());
		});

        // Initialise selected style on first items
        //$(self.slidedeck.el[0].firstChild.firstChild).addClass('selected'); slides should not have a style denoting selection
        $(self.filmstrip.el[0].firstChild.firstChild).addClass('selected');
        $(self.crumbtrail.el[0].firstChild.firstChild).addClass('selected');
        // Because programmatic initiation on first item will get ignored because it thinks it is already selected
        self.goTo(config.initialSlideIndex);

		// Reveal everything
		if (config.enablePagination) {
		    self.show(self.crumbtrail);
		}
		if (config.enableNavigation) {
		    self.show(self.filmstrip);
		}
		self.show(self.slidedeck);
	}
};

/* Run immediately after script is loaded, and pick up all containers classed as
 * .deckard to wrap with Deckard.
*/
Deckard.prototype.init = function () {
};
/* move is a function factory that tailors a move strategy depending on the type of stream affected
 * and the type of vector, i.e. moving to the left or right incrementally, or a integer index.
*/
Deckard.prototype.move = function (stream) {
	return function (vector) {
		var hasRoom = false;
		var displacement = undefined;
		if (typeof vector === 'string' && vector == 'right') {
			hasRoom = (stream.current > 1);
			displacement = -1;
		} else if (typeof vector === 'string' && vector == 'left') {
			hasRoom = (stream.current < stream.total);
			displacement = +1;
		} else if (typeof vector === 'number' && vector + 1 < stream.current) {
			hasRoom = true;
			displacement = -(stream.current - vector + 1) + 2;
		} else if (typeof vector === 'number' && vector + 1 > stream.current) {
			hasRoom = true;
			displacement = +(vector + 1 - stream.current);
		}
		if (hasRoom && stream.isEnabled) {
			stream.isEnabled = false;
			var position = parseInt(stream.el[0].style.left, 10); 
			position = (isNaN(position) ? 0 : position); 
			var cardWidth = parseInt($(stream.el[0].firstChild).css('width'), 10) * stream.size;
			//stream.el[0].style.left = (position - (displacement * cardWidth)) + 'px';
			$(stream.el).animate({
				'left': position - (displacement * cardWidth)
			}, {
				queue: false,
				complete: function () {
					stream.current += displacement;
					stream.isEnabled = true;

					Deckard.mediator.publish(stream, 'move', {
						vector: vector,
						hasRoom: hasRoom,
						displacement: displacement,
						current: stream.current
					});
				}
			});
		}
	};
};

// Expose move functions for programmatic manipulation
Deckard.prototype.goTo = function (index) {
	// Limit to no lower than zero
	index = Math.max(0, index);
	// Limit to no higher than the number of items less one
	index = Math.min(index, this.slidedeck.total - 1);
	// We need only move the slidedeck, and the filmstrip and cumbtrail will listen out and react accordingly
    this.move(this.slidedeck)(index);
};
// Quick functions for start and end
Deckard.prototype.goToFirst = function () {
    this.goTo(0);
};
Deckard.prototype.goToLast = function () {
    this.goTo(this.slidedeck.total - 1);
};
// Move left and right
Deckard.prototype.goToLeft = function () {
	// Remember, going left is actually moving the deck right
    this.move(this.slidedeck)('right');
};
Deckard.prototype.goToRight = function () {
	// Remember, going right is actually moving the deck left
    this.move(this.slidedeck)('left');
};

/* To mitigate flash of unstyled content (FOUC), use hiding and showing functions.
 *
*/
Deckard.prototype.hide = function (stream) {
    stream.el.parent().parent().parent().css({'display': 'none'});
    return stream;
};
Deckard.prototype.show = function (stream) {
	stream.el.parent().parent().parent().css({'display': 'table'});
	return stream;
};

/* mediator exists to allow a decoupled way for component pieces to communicate, namely, by way of
 * publishing of and subscribing to events, and indeed objects.
*/
Deckard.mediator = {
	// The keys are either the name of an object or event, and the values are a list of callbacks.
	// Any time an object emits any event, its list of callbacks will be invoked.
	// Any time an event is emitted by any object, its list of callbacks will be invoked.
	subscriptions: {
		'move': []
	},
	// Add objects (and indeed named events) to the subscriptions database.
	register: function (publisher) {
		var registered = false;
		if (publisher && !this.subscriptions[publisher]) {
			this.subscriptions[publisher] = [];
			registered = true;
		} 
		return registered;
	},
	// Emit an event and fire all relevant callbacks.
	publish: function (publisher, event, data) {
		if (publisher && this.subscriptions[publisher]) {
			for (var callback in this.subscriptions[publisher]) {
				this.subscriptions[publisher][callback](event, data);
			}
		}
		if (event && this.subscriptions[event]) {
			for (var callback in this.subscriptions[event]) {
				this.subscriptions[event][callback](event, data);
			}
		}
	},
	// Add callbacks for relevant objects or events.
	subscribe: function (publisher, event, callback) {
		if (publisher && this.subscriptions[publisher]) {
			this.subscriptions[publisher].push(callback);
		}
		if (event && this.subscriptions[event]) {
			this.subscriptions[event].push(callback);
		}
	}
};