"use strict";
/*

Group: Utility Functions

*/


/*
Method: excludeType

Removes a specific type of primitive from an array of primitives.

Parameter:

array - An array of primitives.
type - The type of primitives to remove (e.g. "Flow" or "Stock"). May also be an array of types. 

Return:

A duplicate of the input array without any primitives of the specified type.

*/


function excludeType(array, type) {
	var removeSingle = function(array, type){
		if (array instanceof Array) {
			var res = [];
			for (var i = 0; i < array.length; i++) {
				if (array[i].value.nodeName != type) {
					res.push(array[i]);
				}
			}
			return res;
		} else {
			if (array == null) {
				return array;
			}
			if (array.value.nodeName == type) {
				return null
			}
			return array;
		}
	}
	
	if(Array.isArray(type)){
		for(var i = 0; i < type.length; i++){
			array = removeSingle(array, type[i]);
		}
		return array;
	}else{
		return removeSingle(array, type);
	}
	
}

/*
Method: primitiveIndex

Locates the index of a specific primitive in an array of primitives.

Parameter:

array - An array of primitives.
primitive - The specific primitive to find.

Return:

The index of the primitive in the array. Returns -1 if the primitive is not found.

*/


function primitiveIndex(array, primitive) {
	for (var i = 0; i < array.length; i++) {
		if (array[i].id == primitive.id) {
			return i;
		}
	}
	return -1;
}

/*
Method: uniquePrimitives

Returns the passed array with duplicated primitives removed

Parameter:

primitives - An array of primitives.

Return:

An array of primitives with any duplicated elements removed.

*/


function uniquePrimitives(primitives) {
	var res = [];
	for (var i = 0; i < primitives.length; i++) {
		var found = false;
		for (var r = 0; r < res.length; r++) {
			if (res[r].id == primitives[i].id) {
				found = true;
				break;
			}
		}
		if (!found) {
			res.push(primitives[i]);
		}
	}
	return res;
}

/*
Method: setGlobal

Sets the value of a global variable. This can allow communication between buttons or the storing of some state.

Parameter:

name - The name of the global variable.
value - The value of the global variable.

See also:

<getGlobal>


*/

var globalVarBank = {};

function setGlobal(name, value) {
	globalVarBank["_" + name] = value;
}

/*
Method: getGlobal

Gets the value of a global variable. This can allow communication between buttons or the storing of some state.

Parameter:

name - The name of the global variable for which to get the value.

Return:

The value of the global variable specified by name.

Example:

> setGlobal("Example Var 1", 42);
> setGlobal("Example Var 2", "test");
> var z = getGlobal("Example Var 1"); // z is now set to 42
> var y = getGlobal("Example Var 2"); // y is now set to "test"

See also:

<setGlobal>

*/

function getGlobal(name) {
	return globalVarBank["_" + name];
}



