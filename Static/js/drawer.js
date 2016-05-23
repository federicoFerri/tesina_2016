// Variables for referencing the canvas and 2dcanvas context
var canvas,ctx;

// Variables to keep track of the mouse position and left-button status 
var mouseX,mouseY,mouseDown=0;

// Variables to keep track of the touch position
var touchX,touchY;

// Keep track of the old/last position when drawing a line
// We set it to -1 at the start to indicate that we don't have a good value for it yet
var lastX,lastY=-1;

var paths = []; // recording paths
var color = "black";
var lineWidth = 20;
          
var clearBeforeDraw = false;

//neural net with one hidden layer; sigmoid for hidden, softmax for output
function nn(data, w12, bias2, w23, bias3) {
	// just some incomplete sanity checks to find the most obvious errors
	if (!Array.isArray(data) || data.length == 0 ||
	!Array.isArray(w12) || w12.length == 0 || !Array.isArray(w12[0]) || data.length != w12[0].length || !Array.isArray(bias2) || bias2.length != w12.length ||
	!Array.isArray(w23) || w23.length == 0 || !Array.isArray(w23[0]) || w12.length != w23[0].length || !Array.isArray(bias3) || bias3.length != w23.length) {
		console.error('nn(): invalid parameters');
		console.log('d: '+data.length+', w12: '+w12.length+', w12[0]: '+w12[0].length+', bias2: '+bias2.length+
		', w23: '+w23.length+', w23[0]: '+w23[0].length+', bias3: '+bias3.length);
		return undefined;
	}
	var t1 = new Date();
        
	// compute layer2 output
	var out2 = [];
	for (var i=0; i<w12.length; i++) {
		out2[i] = bias2[i];
		for (var j=0; j<w12[i].length; j++) {
			out2[i] += data[j] * w12[i][j];
		}
		out2[i] = 1 / (1 + Math.exp(-out2[i]));
	}
	//compute layer3 activation
	var out3 = [];
	for (var i=0; i<w23.length; i++) {
		out3[i] = bias3[i];
		for (var j=0; j<w23[i].length; j++) {
			out3[i] += out2[j] * w23[i][j];
		}
	}
	// compute layer3 output (softmax)
	var max3 = out3.reduce(function(p,c) { return p>c ? p : c; });
	var nominators = out3.map(function(e) { return Math.exp(e - max3); });
	var denominator = nominators.reduce(function (p, c) { return p + c; });
	var output = nominators.map(function(e) { return e / denominator; });
        
	// timing measurement
	var dt = new Date() - t1; console.log('NN time: '+dt+'ms');
	return output;
}

// computes center of mass of digit, for centering
// note 1 stands for black (0 white) so we have to invert.
function centerImage(img) {
	var meanX = 0;
	var meanY = 0;
	var rows = img.length;
	var columns = img[0].length;
	var sumPixels = 0;
	for (var y = 0; y < rows; y++) {
		for (var x = 0; x < columns; x++) {
			var pixel = (1 - img[y][x]);
			sumPixels += pixel;
			meanY += y * pixel;
			meanX += x * pixel;
		}
	}
	meanX /= sumPixels;
	meanY /= sumPixels;
        
	var dY = Math.round(rows/2 - meanY);
	var dX = Math.round(columns/2 - meanX);
	return {transX: dX, transY: dY};
}

// given grayscale image, find bounding rectangle of digit defined
// by above-threshold surrounding
function getBoundingRectangle(img, threshold) {
	var rows = img.length;
	var columns = img[0].length;
	var minX=columns;
	var minY=rows;
	var maxX=-1;
	var maxY=-1;
	for (var y = 0; y < rows; y++) {
		for (var x = 0; x < columns; x++) {
			if (img[y][x] < threshold) {
				if (minX > x) minX = x;
				if (maxX < x) maxX = x;
				if (minY > y) minY = y;
				if (maxY < y) maxY = y;
			}
		}
	}
	return { minY: minY, minX: minX, maxY: maxY, maxX: maxX};
}

// take canvas image and convert to grayscale. Mainly because my
// own functions operate easier on grayscale, but some stuff like
// resizing and translating is better done with the canvas functions
function imageDataToGrayscale(imgData) {
	var grayscaleImg = [];
	for (var y = 0; y < imgData.height; y++) {
		grayscaleImg[y]=[];
		for (var x = 0; x < imgData.width; x++) {
			var offset = y * 4 * imgData.width + 4 * x;
			var alpha = imgData.data[offset+3];
			// weird: when painting with stroke, alpha == 0 means white;
			// alpha > 0 is a grayscale value; in that case I simply take the R value
			if (alpha == 0) {
				imgData.data[offset] = 255;
				imgData.data[offset+1] = 255;
				imgData.data[offset+2] = 255;
			}
			imgData.data[offset+3] = 255;
			// simply take red channel value. Not correct, but works for
			// black or white images.
			grayscaleImg[y][x] = imgData.data[y*4*imgData.width + x*4 + 0] / 255;
		}
	}
	return grayscaleImg;
}

// takes the image in the canvas, centers & resizes it, then puts into 10x10 px bins
// to give a 28x28 grayscale image; then, computes class probability via neural network
function recognize(canvas,ctx) {
	var t1 = new Date();
        
	// convert RGBA image to a grayscale array, then compute bounding rectangle and center of mass  
	var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	grayscaleImg = imageDataToGrayscale(imgData);
	var boundingRectangle = getBoundingRectangle(grayscaleImg, 0.01);
	var trans = centerImage(grayscaleImg); // [dX, dY] to center of mass
        
	// copy image to hidden canvas, translate to center-of-mass, then
	// scale to fit into a 200x200 box (see MNIST calibration notes on
	// Yann LeCun's website)
	var canvasCopy = document.createElement("canvas");
	canvasCopy.width = imgData.width;
	canvasCopy.height = imgData.height;
	var copyCtx = canvasCopy.getContext("2d");
	var brW = boundingRectangle.maxX+1-boundingRectangle.minX;
	var brH = boundingRectangle.maxY+1-boundingRectangle.minY;
	var scaling = 190 / (brW>brH?brW:brH);
	// scale
	copyCtx.translate(canvas.width/2, canvas.height/2);
	copyCtx.scale(scaling, scaling);
	copyCtx.translate(-canvas.width/2, -canvas.height/2);
	// translate to center of mass
	copyCtx.translate(trans.transX, trans.transY);
        
	// default take image from original canvas
	copyCtx.drawImage(ctx.canvas, 0, 0);
               
	// now bin image into 10x10 blocks (giving a 28x28 image)
	imgData = copyCtx.getImageData(0, 0, 280, 280);
	grayscaleImg = imageDataToGrayscale(imgData);
	var nnInput = new Array(784);
	for (var y = 0; y < 28; y++) {
		for (var x = 0; x < 28; x++) {
			var mean = 0;
			for (var v = 0; v < 10; v++) {
				for (var h = 0; h < 10; h++) {
					mean += grayscaleImg[y*10 + v][x*10 + h];
				}
			}
			mean = (1 - mean / 100); // average and invert
			nnInput[x*28+y] = (mean - .5) / .5;
		}
	}
        
	// for visualization/debugging: paint the input to the neural net.
	if (document.getElementById('preprocessing').checked == true) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(copyCtx.canvas, 0, 0);
		for (var y = 0; y < 28; y++) {
			for (var x = 0; x < 28; x++) {
				var block = ctx.getImageData(x * 10, y * 10, 10, 10);
				var newVal = 255 * (0.5 - nnInput[x*28+y]/2);
				for (var i = 0; i < 4 * 10 * 10; i+=4) {
					block.data[i] = newVal;
					block.data[i+1] = newVal;
					block.data[i+2] = newVal;
					block.data[i+3] = 255;
				}
				ctx.putImageData(block, x * 10, y * 10);
			}
		}
	}
        
	//for copy & pasting the digit into matlab
	//document.getElementById('nnInput').innerHTML=JSON.stringify(nnInput)+';<br><br><br><br>';
	var maxIndex = 0;
	var nnOutput = nn(nnInput, w12, bias2, w23, bias3);
	console.log(nnOutput);
	var buffOut = '<table>';
	for (var i = 0; i < nnOutput.length/2; i++) {
		buffOut += '<tr><td><b>'+(i)+'</b>: '+Math.round(nnOutput[i] * 100)+'%</td>';
		buffOut += '<td><b>'+(i+5)+'</b>: '+Math.round(nnOutput[i+5] * 100)+'%</td></tr>';
	}
	buffOut += '</table>';
	document.getElementById('verbose').innerHTML=buffOut;
	nnOutput.reduce(function(p,c,i){if(p<c) {maxIndex=i; return c;} else return p;});
	console.log('maxIndex: '+maxIndex);
	document.getElementById('nnOut').innerHTML=maxIndex;
	clearBeforeDraw = true;
	var dt = new Date() - t1;
	console.log('recognize time: '+dt+'ms');
}


// Draws a line between the specified position on the supplied canvas name
// Parameters are: A canvas context, the x position, the y position, the size of the dot
function drawLine(ctx,x,y,size) {

	// If lastX is not set, set lastX and lastY to the current position 
	if (lastX==-1) {
		lastX=x;
		lastY=y;
	}

	// Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
	r=0; g=0; b=0; a=255;

	// Select a fill style
	ctx.strokeStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";

	// Set the line "cap" style to round, so lines at different angles can join into each other
	ctx.lineCap = "round";
	//ctx.lineJoin = "round";

	// Draw a filled line
	ctx.beginPath();

	// First, move to the old (previous) position
	ctx.moveTo(lastX,lastY);

	// Now draw a line to the current touch/pointer position
	ctx.lineTo(x,y);

        // Set the line thickness and draw the line
        ctx.lineWidth = size;
        ctx.stroke();

        ctx.closePath();

	// Update the last position to reference the current position
	lastX=x;
	lastY=y;
} 

// Clear the canvas context using the canvas width and height
function clearCanvas(canvas,ctx) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	document.getElementById('nnOut').innerHTML = '';
	document.getElementById('verbose').innerHTML = '';	
}

// Keep track of the mouse button being pressed and draw a dot at current location
function sketchpad_mouseDown() {
	mouseDown=1;
	drawLine(ctx,mouseX,mouseY,12);
}

// Keep track of the mouse button being released
function sketchpad_mouseUp() {
	mouseDown=0;

	// Reset lastX and lastY to -1 to indicate that they are now invalid, since we have lifted the "pen"
	lastX=-1;
	lastY=-1;
}

// Keep track of the mouse position and draw a dot if mouse button is currently pressed
function sketchpad_mouseMove(e) { 
	// Update the mouse co-ordinates when moved
	getMousePos(e);

	// Draw a dot if the mouse button is currently being pressed
	if (mouseDown==1) {
		drawLine(ctx,mouseX,mouseY,12);
	}
}

// Get the current mouse position relative to the top-left of the canvas
function getMousePos(e) {
	if (!e) var e = event;

	if (e.offsetX) {
		mouseX = e.offsetX;
		mouseY = e.offsetY;
	} else if (e.layerX) {
		mouseX = e.layerX;
		mouseY = e.layerY;
	}
}

// Draw something when a touch start is detected
function sketchpad_touchStart() {
	// Update the touch co-ordinates
	getTouchPos();

	drawLine(ctx,touchX,touchY,12);

	// Prevents an additional mousedown event being triggered
	event.preventDefault();
}

function sketchpad_touchEnd() {
	// Reset lastX and lastY to -1 to indicate that they are now invalid, since we have lifted the "pen"
	lastX=-1;
	lastY=-1;
}

// Draw something and prevent the default scrolling when touch movement is detected
function sketchpad_touchMove(e) { 
	// Update the touch co-ordinates
	getTouchPos(e);

	// During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
	drawLine(ctx,touchX,touchY,12); 

	// Prevent a scrolling action as a result of this touchmove triggering.
	event.preventDefault();
}

// Get the touch position relative to the top-left of the canvas
// When we get the raw values of pageX and pageY below, they take into account the scrolling on the page
// but not the position relative to our target div. We'll adjust them using "target.offsetLeft" and
// "target.offsetTop" to get the correct values in relation to the top left of the canvas.
function getTouchPos(e) {
	if (!e) var e = event;
	if(e.touches) {
		if (e.touches.length == 1) { // Only deal with one finger
			var touch = e.touches[0]; // Get the information for finger #1
			touchX=touch.pageX-touch.target.offsetLeft;
			touchY=touch.pageY-touch.target.offsetTop;
		}
	}
}


// Set-up the canvas and add our event handlers after the page has loaded
function init() {
	// Get the specific canvas element from the HTML document
	canvas = document.getElementById('can');

	// If the browser supports the canvas tag, get the 2d drawing context for this canvas
	ctx = canvas.getContext('2d');

	// Check that we have a valid context to draw on/with before adding event handlers
	if (ctx) {
		// React to mouse events on the canvas, and mouseup on the entire document
		canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
		canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
		window.addEventListener('mouseup', sketchpad_mouseUp, false);

		// React to touch events on the canvas
		canvas.addEventListener('touchstart', sketchpad_touchStart, false);
		canvas.addEventListener('touchend', sketchpad_touchEnd, false);
		canvas.addEventListener('touchmove', sketchpad_touchMove, false);
	}
}