'use strict';

var Deckard = function (container) {
	var container = $(container);
	var items = $(container).children();
	if (items.length) {
		//Get the slide dimensions to fit everything around
		var dim = {
			width: Math.round(parseInt($(items).first().css('width'), 10)),
			height: Math.round(parseInt($(items).first().css('height'), 10))
		};
		
		//Calculate filmstrip frame sizes
		var framesPerFilmstrip = 10;
		var frameWidth = Math.round(((dim.width - (framesPerFilmstrip - 1) * 10) / framesPerFilmstrip)); // (x-1)*10: take into account x-1 right margins; /x: want to fit x frames;
		var frameHeight = Math.round(dim.height * (frameWidth / dim.width)); // Apply the scale factor from frameWidth to frameHeight, to maintain proportions
		
		//Calculate filmstrip quantity (crumbtrail page quantity)
		var filmstripTotal = Math.ceil(items.length / framesPerFilmstrip);
		//TODO: work out if pages overflow width of stage or not, if not, apply centering.
		var crumbtrailTotal = Math.ceil(((filmstripTotal * 10) + ((filmstripTotal - 1) * 20)) / dim.width);
		var crumbtrailWidth = Math.min(dim.width, (filmstripTotal * 10) + ((filmstripTotal - 1) * 20));

		//Write the markup
		var markup = '';
		var presentation = '';
		var navigation = '';
		var pagination = '';
		items.each(function (index, item) {
			presentation = presentation + 
				'<div id="" class="slide-outer">\
	    			<div id="" class="slide-inner" style="height:' + dim.height + 'px; width:' + dim.width + 'px;">' + 
    					this.outerHTML +
    				'</div>\
	    		</div>';

	    	navigation = navigation + 
				'<div id="" class="frame-outer">\
	    			<div id="" class="frame-inner" style="height:' + frameHeight + 'px; width:' + frameWidth + 'px;">\
	    				<div class="content">' + index + '</div>\
	    			</div>\
	    		</div>';
		});
		for (var i = 0; i < filmstripTotal; i++) {
			pagination = pagination + 
				'<div id="" class="crumb-outer">\
	    			<div id="" class="crumb-inner">\
	    				<div class="content"></div>\
	    			</div>\
	    		</div>';
		}
		//Write curtains, stage, and belt around items and supply dimensions
		markup =  
			'<div id="" class="pagination" style="' + (crumbtrailTotal === 1 ? 'margin: 0 auto;' : '') + '">\
			    <div id="" class="curtain curtain-left"></div>\
				<div id="" class="stage" style="width:' + crumbtrailWidth + 'px;">\
			    	<div id="" class="firefox-stage">\
						<div id="" class="belt crumbtrail">' +
							pagination + 
						'</div>\
			      	</div>\
			    </div>\
			  	<div id="" class="curtain curtain-right"></div>\
			</div>\
			<div id="" class="navigation">\
			    <div id="" class="curtain curtain-left"></div>\
				<div id="" class="stage" style="height:' + frameHeight + 'px;width:' + dim.width + 'px;">\
			    	<div id="" class="firefox-stage">\
						<div id="" class="belt filmstrip">' +
							navigation + 
						'</div>\
			      	</div>\
			    </div>\
			  	<div id="" class="curtain curtain-right"></div>\
			</div>\
			<div id="" class="presentation">\
			    <div id="" class="curtain curtain-left"></div>\
				<div id="" class="stage"  style="height:' + dim.height + 'px; width:' + dim.width + 'px;">\
			    	<div id="" class="firefox-stage">\
						<div id="" class="belt slidedeck">' +
							presentation + 
						'</div>\
			      	</div>\
			    </div>\
			  	<div id="" class="curtain curtain-right"></div>\
			</div>';
		
		//Overwrite with new markup
		$(container).html(markup);

		var slidedeck = {
			el: $('.deckard .presentation .slidedeck'),
			total: items.length,
			current: 1,
			size: 1,
			isEnabled: true
		};
		var filmstrip = {
			el: $('.deckard .navigation .filmstrip'),
			total: filmstripTotal,
			current: 1,
			size: 10,
			isEnabled: true
		};
		var crumbtrail = {
			el: $('.deckard .pagination .crumbtrail'),
			total: crumbtrailTotal,
			current: 1,
			size: Math.ceil(dim.width / 30),
			isEnabled: true
		};
		//Attach move handlers
		$(container).find('.presentation .curtain-right').on('click', function () { move(slidedeck)('left'); });
		$(container).find('.presentation .curtain-left').on('click', function () { move(slidedeck)('right'); });

		$(container).find('.navigation .curtain-right').on('click', function () { move(filmstrip)('left'); });
		$(container).find('.navigation .curtain-left').on('click', function () { move(filmstrip)('right'); });

		$(container).find('.pagination .curtain-right').on('click', function () { move(crumbtrail)('left'); });
		$(container).find('.pagination .curtain-left').on('click', function () { move(crumbtrail)('right'); });

		$(container).find('.presentation').on('swiperight', function () { move(slidedeck)('right'); });
		$(container).find('.presentation').on('swipeleft', function () { move(slidedeck)('left'); });

		$(container).find('.navigation').on('swiperight', function () { move(filmstrip)('right'); });
		$(container).find('.navigation').on('swipeleft', function () { move(filmstrip)('left'); });

		$(container).find('.pagination').on('swiperight', function () { move(crumbtrail)('right'); });
		$(container).find('.pagination').on('swipeleft', function () { move(crumbtrail)('left'); });

		$(container).find('.pagination .stage .belt .crumb-outer').on('click', function () {
			move(filmstrip)($(this).index());
		});
		$(container).find('.navigation .stage .belt .frame-outer').on('click', function () {
			move(slidedeck)($(this).index());
		});
	}
};

/* Run immediately after script is loaded, and pick up all containers classed as
 * .deckard to wrap with Deckard.
*/
Deckard.prototype.init = function () {
};

var move = function (stream) {
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
			var position = parseInt($(stream.el).css('left'), 10); 
			position = (isNaN(position) ? 0 : position); 
			var cardWidth = parseInt($(stream.el).find('> div').css('width'), 10) * stream.size;
			$(stream.el).animate({
				'left': position - (displacement * cardWidth)
			}, function () {
				stream.current += displacement;
				stream.isEnabled = true;
			});
		}
	};
};