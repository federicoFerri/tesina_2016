function fit() {
	var breakpoint = 530;
	var defStyle = 'margin-right:auto;margin-left:auto;display:block;';
	if ($('#iframe-trigger').width() < breakpoint) {
		//console.log('shorther');
		width = $('#iframe-trigger').width();
		height = width*310/breakpoint;
		styleBuff = 'width:'+width+'px;height:'+height+'px;'+defStyle;
		$('#iframe-frame').attr('style',styleBuff);
		ratio = width/breakpoint;
		styleBuff = 'width:530px;height:310px;';		
		styleBuff += '-ms-zoom: '+ratio+';-moz-transform: scale('+ratio+');';
		styleBuff += '-moz-transform-origin: 0 0;-o-transform: scale('+ratio+');';
      styleBuff += '-o-transform-origin: 0 0;-webkit-transform: scale('+ratio+');';
      styleBuff += '-webkit-transform-origin: 0 0;';
      styleBuff += defStyle;
		$('iframe').attr('style',styleBuff);
	}else{
		//console.log('larger');
		styleBuff = 'width:530px;height:310px;'+defStyle;
		$('#iframe-frame').attr('style',styleBuff);
		$('iframe').attr('style',styleBuff);
	}	
}

$(window).resize(function() {
	fit();
});

$(document).ready(function() {
	fit();
});