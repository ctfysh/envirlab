"use strict";
/*

Group: Converters

*/

/*
Method: getData

Gets the data of a converter.

Parameters:

converter - The converter for which the data is requested. May also be an array of Converters.

Return:

The Converter data as a string. A set of input/output pairs separated by semicolons. Example data form: "1,1;2,4;3,9"

See also:

<setData>
*/

function getData(converter) {
	return map(converter, function(primitive) {
		return primitive.getAttribute("Data");
	});
}

/*
Method: setData

Sets the data of a converter.

Parameters:

converter - The converter for which the data will be set. May also be an array of Converters in which case they will all be set to the same value.
data - The data for the converter as a string. A set of input/output pairs separated by semicolons. Example data form: "1,1;2,4;3,9"

See also:

<getData>
*/

function setData(converter, data) {
	map(converter, function(primitive) {
		setAttributeUndoable(primitive, "Data", data);
	});
}


/*
Method: getConverterInput

Gets the input source of a converter.

Parameters:

converter - The converter for which the input source is requested. May also be an array of Converters.

Return:

The input source. If the input source is a primitive, returns the primitive. Otherwise returns null (indicating the use of time as the input source).

See also:

<setInputSource>
*/

function getConverterInput(converter) {
	return map(converter, function(primitive) {
		var x = primitive.getAttribute("Source");
		if (x == "Time") {
			return null;
		} else {
			return findID(x);
		}
	});
}

/*
Method: setConverterInput

Sets the input source of a converter.

Parameters:

converter - The converter for which the input source will be set. May also be an array of Converters in which case they will all be set to the same value.
input - The input source. Pass either a primitive or use null to indicate the usage of time as the input.

See also:

<getConverterInput>
*/

function setConverterInput(converter, input) {
	map(converter, function(primitive) {
		if (input == null) {
			setAttributeUndoable(primitive, "Source", "Time");
		} else {
			setAttributeUndoable(primitive, "Source", input.id);
		}
	});
}


/*
Method: getInterpolation

Gets the interpolation mode of a converter.

Parameters:

converter - The converter for which the interpolation is requested. May also be an array of Converters.

Return:

The interpolation mode as a string. May be "Linear" or "Discrete".

See also:

<setInterpolation>
*/

function getInterpolation(converter) {
	return map(converter, function(primitive) {
		return primitive.getAttribute("Interpolation");
	});
}

/*
Method: setInterpolation

Sets the interpolation mode of a converter.

Parameters:

converter - The converter for which the interpolation will be set. May also be an array of Converters in which case they will all be set to the same value.
interpolation - The interpolation mode for the converter as a string. May either be "Linear" or "Discrete".

See also:

<getInterpolation>
*/

function setInterpolation(converter, interpolation) {
	map(converter, function(primitive) {
		setAttributeUndoable(primitive, "Interpolation", interpolation);
	});
}


