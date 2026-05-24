"use strict";
/*

Group: Stocks

*/

/*
Method: getNonNegative

Gets the non-negative property of stocks (also applicable to flows). A non-negative stock will never become negative.

Parameters:

primitive - The stock for which the value is requested. May also be an array of stock.

Return:

The non-negative value of the stock. If an array of primitives was passed, returns an array of values.

See also:

<setNonNegative>
*/


function getNonNegative(primitive) {
	return map(primitive, function(primitive) {
		if (primitive.value.nodeName == "Stock") {
			return isTrue(primitive.getAttribute("NonNegative"));
		} else {
			return isTrue(primitive.getAttribute("OnlyPositive"));
		}
	});
}

/*
Method: setNonNegative

Sets the non-negative value of the passed stocks (also applicable to flows).

Parameters:

primitive - The stock for which the non-negative value will be set. May also be an array of stocks in which case they will all be set to the same value.
nonNegative - The new non-negative status for the stock. Either true or false.

See also:

<getNonNegative>
*/


function setNonNegative(primitive, nonNegative) {
	map(primitive, function(primitive) {
		if (primitive.value.nodeName == "Stock") {
			setAttributeUndoable(primitive, "NonNegative", nonNegative);
		} else {
			setAttributeUndoable(primitive, "OnlyPositive", nonNegative);
			if(!(primitive instanceof SimpleNode)){
				if (nonNegative) {
	                graph.setCellStyles(mxConstants.STYLE_STARTARROW, "", [primitive]);
	            } else {
	                graph.setCellStyles(mxConstants.STYLE_STARTARROW, "block", [primitive]);
	                graph.setCellStyles("startFill", 0, [primitive]);
	            }
			}
           
			
		}
	});
}

/*
Method: getStockType

Gets the type of the stock. The type affects the behavior of the stock and may either be "Store" (the default) or "Conveyor".

Parameters:

primitive - The stock for which the type is requested. May also be an array of stocks.

Return:

The type of the stock as a string. If an array of stocks was passed, returns an array of strings.

See also:

<setStockType>
*/

function getStockType(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("StockMode");
	});
}

/*
Method: setStockType

Sets the type of the passed stock.

Parameters:

primitive - The stock for which the type will be set. May also be an array of stocks in which case they will all be set to the same type.
type - The type of the stock as a string. Either "Store" (the default) or "Conveyor".

See also:

<getStockType>
*/

function setStockType(primitive, type) {
	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "StockMode", type);
	});
}


/*
Method: getDelay

Gets the delay length of conveyor stocks.

Parameters:

primitive - The stock for which the value is requested. May also be an array of stocks.

Return:

The delay length of the stock. If an array of stocks was passed, returns an array of lengths.

See also:

<setDelay>
*/

function getDelay(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("Delay");
	});
}

/*
Method: setDelay

Sets the delay length of the passed conveyor stock.

Parameters:

primitive - The stock for which the delay length will be set. May also be an array of stocks in which case they will all be set to the same value.
delay - The delay length for the stock.

See also:

<getDelay>
*/

function setDelay(primitive, delay) {
	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "Delay", delay);
	});

}

