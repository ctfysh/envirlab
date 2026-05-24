"use strict";
/*

Group: Finding and Accessing Specific Primitives

*/

/*
Method: findName

Finds and returns a primitive by its name. If more than one primitive with the same name exists, returns an array of primitives.

Parameters:

name - The name of the primitive to return as a string. Also accepts an array of strings in which case all the primitives named in the array will be returned.

Return:

A primitive. If multiple primitives exist with the same name, an array of primitives will be returned. Returns null if no primitives are found.

See also:

<findType>, <findAll>, <findID>, <findNote>, <findValue>

*/


function findName(name) {
	var res = map(name, function(name) {
		var res = [];
		var myCells = findAll();
		for (var i = 0; i < myCells.length; i++) {
			if (isDefined(myCells[i].getAttribute("name")) && myCells[i].getAttribute("name").toLowerCase() == name.toLowerCase()) {
				res.push(myCells[i]);
			}
		}
		return res;
	});

	res = flatten(res);
	res = res.filter(function(val) {
		return val !== null;
	});

	if (name instanceof Array) {
		return res;
	} else {
		if (res.length == 0) {
			return null;
		} else if (res.length == 1) {
			return res[0];
		} else {
			return res;
		}

	}

}

/*
Method: findAll

Finds and returns all primitives in the model.

Return:

An array of primitives.

See also:

<findName>, <findType>, <findID>, <findNote>, <findValue>

*/


function findAll() {
	var all = primitives();
	var res = [];
	for (var i = 0; i < all.length; i++) {
		if (!(all[i].value.nodeName == "Setting" || all[i].value.nodeName == "Display")) {
			res.push(all[i]);
		}
	}
	return res;
}




/*
Method: findType

Finds and returns all primitives of a specific type.

Parameters:

type - The type of primitives to return. For instance: "Stock", "Flow", "Link", "Text", "Button", "Picture", "Converter" or "Variable". An array of type strings may also be passed.

Return:

An array of primitives of the specified type.

See also:

<findName>, <findAll>, <findID>, <findNote>, <findValue>

*/


function findType(type) {
	var res = map(type, function(type) {
		var t = type;
		return primitives(t);

	});
	res = flatten(res);
	return res;

}

/*
Method: findID

Finds and returns a primitive using its ID.

Parameters:

ID - The ID of the primitive to find. May also be an array of IDs.

Return:

A primitive. If an array of IDs was passed, returns an array of primitives.

See also:

<findName>, <findType>, <findAll>, <findValue>, <findNote>, <getID>

*/



function findID(id) {
	var myCells = primitives();
	var res = map(id, function(id) {
		for (var i = 0; i < myCells.length; i++) {
			if (myCells[i].id == id) {
				return myCells[i];
			}
		}
		return null;
	});
	if (res === null) {
		return res;
	}
	if (id instanceof Array) {
		return res;
	} else {
		if (res.length == 1) {
			return res[0];
		} else {
			return res;
		}
	}
}

/*
Method: findValue

Finds and returns all primitives whose values match a regular expression.

Parameters:

search - The regular expression to search for. Can also be a string in which case the primitive values will be tested for strict case-sensitive equality against the string. May also be an array of regular expressions and strings in which case any primitive with a value that matches one element of the array will be returned.

Return:

An array of primitives whose values match the regular expression. Returns an empty array if no primitives match.

Example:

> // Returns all primitives that use the log function
> var containingLog = findValue(/log\(/i);
>
> // Returns all primitives whose value is strictly "1"
> var isOne = findValue("1");

See also:

<findName>, <findType>, <findAll>, <findNote>, <getID>

*/


function findValue(search) {
	var myCells = findAll();


	var res = map(search, function(regEx) {
		var res = [];
		for (var i = 0; i < myCells.length; i++) {
			if (regEx instanceof RegExp) {
				if (regEx.test(getValue(myCells[i]))) {
					res.push(myCells[i]);
				}
			} else {
				if (getValue(myCells[i]) == regEx) {
					res.push(myCells[i]);
				}
			}
		}
		return res;
	});

	return uniquePrimitives(flatten(res));
}

/*
Method: findNote

Finds and returns all primitives whose notes match a regular expression.

Parameters:

search - The regular expression to search for. Can also be a string in which case the primitive notes will be tested for strict case-sensitive equality against the string. May also be an array of regular expressions and strings in which case any primitive with a note that matches one element of the array will be returned.

Return:

An array of primitives whose notes match the regular expression. Returns an empty array if no primitives match.

See also:

<findName>, <findType>, <findAll>, <findValue>, <getID>

*/


function findNote(search) {
	var myCells = findAll();


	var res = map(search, function(regEx) {
		var res = [];
		for (var i = 0; i < myCells.length; i++) {
			if (regEx instanceof RegExp) {
				if (regEx.test(getNote(myCells[i]))) {
					res.push(myCells[i]);
				}
			} else {
				if (getNote(myCells[i]) == regEx) {
					res.push(myCells[i]);
				}
			}
		}
		return res;
	});

	return uniquePrimitives(flatten(res));
}


