$(document).ready(function () {

$(document).on('impress:stepactivate', function (event) {
  var target = $(event.target);
  var body = $(document.body);
  body.removeClass(
    'white-bg gray-bg red-bg orange-bg green-bg purple-bg blue-bg');
  if (target.hasClass('white'))
    body.addClass('white-bg');
  else if (target.hasClass('gray'))
    body.addClass('gray-bg');
  else if (target.hasClass('red'))
    body.addClass('red-bg');
  else if (target.hasClass('orange'))
    body.addClass('orange-bg');
  else if (target.hasClass('green'))
    body.addClass('green-bg');
  else if (target.hasClass('purple'))
    body.addClass('purple-bg');
  else if (target.hasClass('blue'))
    body.addClass('blue-bg');
});

var nbOptions = 5;
		var angleStart = -360;

		// jquery rotate animation
		function rotate(li,d) {
    		$({d:angleStart}).animate({d:d}, {
        		step: function(now) {
            	$(li)
               	.css({ transform: 'rotate('+now+'deg)' })
               	.find('div')
                  	.css({ transform: 'rotate('+(-now)+'deg)' });
        		}, duration: 0
   	 	});
		}

		// show / hide the options
		function toggleOptions(s) {
    		$(s).toggleClass('open');
    		var li = $(s).find('li');
    		var deg = $(s).hasClass('half') ? 180/(li.length-1) : 360/li.length;
    		for(var i=0; i<li.length; i++) {
        		var d = $(s).hasClass('half') ? (i*deg)-90 : i*deg;
        		$(s).hasClass('open') ? rotate(li[i],d) : rotate(li[i],angleStart);
    		}
		}

$(document).on('impress:stepactivate', function (event) {
  if ($(event.target).context.id == "step-map"){
  		if (!$('.selector').hasClass('open')){
    		setTimeout(function(){toggleOptions('.selector');}, 100);
    	}
  }
});

//impress load

});
