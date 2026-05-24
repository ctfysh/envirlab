"use strict";
/*

Group: Primitive Styling Functions

*/

/*
Method: flash

Temporarily changes the opacity of a primitive. Opacity between 0 (invisible) to 100 (fully opaque).

Parameters:

primitive - The primitive which will be flashed. May also be an array of primitives.
opacity - Optional temporary opacity for the primitive. Defaults to 0.
duration - Optional duration the primitive will be at the temporary opacity in milliseconds. Defaults to 100.

Example:

> flash(getSelected());

*/

function flash(primitive, opacity, duration){
	map(primitive, function(primitive){
		if(primitive.value.nodeName == "Folder"){
			flash(getChildren(primitive, false), opacity, duration);
		}
		var orig = getOpacity(primitive);
		setOpacity(primitive, opacity || 0);
		setTimeout(function(){
			setOpacity(primitive, orig);
		}, duration || 100);
	})
}

/*
Method: getShowSlider

Gets the show slider property of the passed primitive.

Parameters:

primitive - The primitive for which the show slider property will be returned. May also be an array of primitives.

Return:

Whether to show the slider property of the primitive. A boolean.

*/

function getShowSlider(primitive) {
	return map(primitive, function(primitive) {
		return isTrue(primitive.getAttribute("ShowSlider"));
	});

}

/*
Method: setShowSlider

Sets the show slider property of the passed primitive. 

Parameters:

primitive - The primitive for which the show slider property will be set. May also be an array of primitives in which case they will all be set to the same show slider value.
showSlider - Boolean whether to show the slider.

*/

function setShowSlider(primitive, showSlider) {

	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "ShowSlider", showSlider);
	});

}

/*
Method: getSliderMin

Gets the slider min property of the passed primitive.

Parameters:

primitive - The primitive for which the slider min property will be returned. May also be an array of primitives.

Return:

The minimum allowed value for the slider

*/

function getSliderMin(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("SliderMin");
	});

}

/*
Method: setSliderMin

Sets the slider min property of the passed primitive. 

Parameters:

primitive - The primitive for which the slider property will be set. May also be an array of primitives in which case they will all be set to the same slider value.
sliderMin - The minimum value of the slider.

*/

function setSliderMin(primitive, sliderMin) {

	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "SliderMin", sliderMin);
	});

}

/*
Method: getSliderMax

Gets the slider max property of the passed primitive.

Parameters:

primitive - The primitive for which the slider max property will be returned. May also be an array of primitives.

Return:

The maximum allowed value for the slider

*/

function getSliderMax(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("SliderMax");
	});

}

/*
Method: setSliderMax

Sets the slider max property of the passed primitive. 

Parameters:

primitive - The primitive for which the slider property will be set. May also be an array of primitives in which case they will all be set to the same slider value.
sliderMax - The maximum value of the slider.

*/

function setSliderMax(primitive, sliderMax) {

	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "SliderMax", sliderMax);
	});

}

/*
Method: getSliderStep

Gets the slider step property of the passed primitive.

Parameters:

primitive - The primitive for which the slider property will be returned. May also be an array of primitives.

Return:

The step value for the slider

*/

function getSliderStep(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("SliderStep");
	});

}

/*
Method: setSliderStep

Sets the slider step property of the passed primitive. 

Parameters:

primitive - The primitive for which the slider property will be set. May also be an array of primitives in which case they will all be set to the same slider value.
sliderStep - The step value of the slider.

*/

function setSliderStep(primitive, sliderStep) {

	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "SliderStep", sliderStep);
	});

}


/*
Method: getOpacity

Gets the opacity of the passed primitive. Opacity is a value between 0 (invisible) to 100 (fully opaque).

Parameters:

primitive - The primitive for which the opacity will be returned. May also be an array of primitives.

Return:

The opacity of the primitive

*/

function getOpacity(primitive) {
	return map(primitive, function(primitive) {
		return graph.getCellStyle(primitive).opacity;
	});

}

/*
Method: setOpacity

Sets the opacity of the passed primitive. Opacity is a value between 0 (invisible) to 100 (fully opaque).

Parameters:

primitive - The primitive for which the opacity will be set. May also be an array of primitives in which case they will all be set to the same opacity.
opacity - The new opacity for the primitive.

*/

function setOpacity(primitive, opacity) {

	map(primitive, function(primitive) {
		var style = primitive.getStyle();
		style = mxUtils.setStyle(style, "opacity", opacity);
		style = mxUtils.setStyle(style, mxConstants.STYLE_TEXT_OPACITY, opacity);

		graph.getModel().execute(new mxStyleChange(graph.getModel(),
			primitive,
			style));

		propogateGhosts(primitive);

	});

}


/*
Method: getLineColor

Gets the line color of the passed primitive.

Parameters:

primitive - The primitive for which the line color will be returned. May also be an array of primitives.

Return:

The line color of the primitive

*/

function getLineColor(primitive) {
	return map(primitive, function(primitive) {
		return graph.getCellStyle(primitive).strokeColor;
	});
}

/*
Method: setLineColor

Sets the line color of the passed primitive.

Parameters:

primitive - The primitive for which the line color will be set. May also be an array of primitives in which case they will all be set to the same color.
lineColor - The new line color for the primitive.

*/

function setLineColor(primitive, lineColor) {

	map(primitive, function(primitive) {
		var style = primitive.getStyle();
		style = mxUtils.setStyle(style, "strokeColor", lineColor);

		graph.getModel().execute(new mxStyleChange(graph.getModel(),
			primitive,
			style));

		propogateGhosts(primitive);

	});

}

/*
Method: getFontColor

Gets the font color of the passed primitive.

Parameters:

primitive - The primitive for which the font color will be returned. May also be an array of primitives.

Return:

The font color of the primitive

*/

function getFontColor(primitive) {
	return map(primitive, function(primitive) {
		return graph.getCellStyle(primitive).fontColor;
	});

}

/*
Method: setFontColor

Sets the font color of the passed primitive.

Parameters:

primitive - The primitive for which the font color will be set. May also be an array of primitives in which case they will all be set to the same color.
fontColor - The new font color for the primitive.

*/

function setFontColor(primitive, fontColor) {

	map(primitive, function(primitive) {
		var style = primitive.getStyle();
		style = mxUtils.setStyle(style, "fontColor", fontColor);

		graph.getModel().execute(new mxStyleChange(graph.getModel(),
			primitive,
			style));

		propogateGhosts(primitive);

	});

}

/*
Method: getFillColor

Gets the fill color of the passed primitive.

Parameters:

primitive - The primitive for which the fill color will be returned. May also be an array of primitives.

Return:

The fill color of the primitive

*/

function getFillColor(primitive) {
	return map(primitive, function(primitive) {
		return graph.getCellStyle(primitive).fillColor;
	});

}

/*
Method: setFillColor

Sets the fill color of the passed primitive.

Parameters:

primitive - The primitive for which the fill color will be set. May also be an array of primitives in which case they will all be set to the same color.
fillColor - The new fill color for the primitive.

*/

function setFillColor(primitive, fillColor) {

	map(primitive, function(primitive) {
		var style = primitive.getStyle();
		style = mxUtils.setStyle(style, "fillColor", fillColor);

		graph.getModel().execute(new mxStyleChange(graph.getModel(),
			primitive,
			style));

		propogateGhosts(primitive);

	});

}


/*
Method: getImage

Gets the image of the passed primitive.

Parameters:

primitive - The primitive for which the image will be returned. May also be an array of primitives.

Return:

The image of the primitive as a string

*/

function getImage(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("Image");
	});

}

/*
Method: setImage

Sets the image of the passed primitive.

Parameters:

primitive - The primitive for which the image will be set. May also be an array of primitives in which case they will all be set to the same image.
image - The image url or alias as a string.

*/

function setImage(primitive, image) {

	map(primitive, function(primitive) {
		primitive.setAttribute("Image", image);
		setPicture(primitive);
	});

}

