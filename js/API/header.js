"use strict";
/*

Copyright 2010-2020 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

/*
Class: Insight Maker API

Functions to manipulate Insight Maker models.

Introduction:

The following is a set of API functions for Insight Maker. JavaScript is the language used for these interfaces. In addition to the Insight Maker specific functions listed here,
standard JavaScript is also supported in buttons.

There are three primary avenues for making use of this API.

* For the "Action" of Buttons embedded within models.

* For a parent page to manipulate an embedded IFRAME containing an Insight Maker model.

* Using the JavaScript console of the web browser to manipulate a model. To find the built-in JavaScript console for a web browser, 
see the relevant browser's documentation.

Primitive Types:

A number of the API function refer to primitives by their type. The following are the valid types. Types are usually quoted when used and should always be capitalized (e.g. "Stock").

* Stock
* Variable
* Converter
* Flow
* Link
* Text
* Picture
* Folder
* Button
* Ghost

Examples:

The following examples illustrate the usage of the API for certain scenarios.

Using Dialogues:

Ask the user to specify a URL and opens a new web page at the location.

> showURL(showPrompt("What page should I open?"));

Expanding and Collapsing Folders:

This example expands all the folders in the model.

> expandFolder(findType("Folder"));

And this collapses them.

> collapseFolder(findType("Folder"));

Notes:

Show the notes for all flow and link primitives in the model.

> var connectors = findType(["Flow", "Link"]);
> showNote(connectors);

Using Opacity:

Makes the currently selected primitives partially transparent.

> setOpacity(getSelected(), 50);

Rabbit Birth Rate:

This  example will  work with the default Insight Maker model.
It prompts the user to specify the birth rate for the rabbit population.
It then sets the relevant primitive to that value and runs the model.

> var birthRate = showPrompt("Enter the birth rate for the rabbits:", 0.1);
> var birthPrimitive = findName("Rabbit Birth Rate");
> setValue(birthPrimitive, birthRate);
> runModel();

This could also be written more compactly as

> setValue(findName("Rabbit Birth Rate"), showPrompt("Enter the birth rate for the rabbits:", 0.1));
> runModel();

Building a Model:

This example creates a new model with two stocks connected by a flow.

> clearModel();
>
> var source = createPrimitive("Source", "Stock", [100, 50], [140, 50]);
> setValue(source, 100); //Give the source an initial value of 100
>
> var sink = createPrimitive("Sink", "Stock", [100, 300], [140, 50]);
>
> var myFlow = createConnector("Leakage", "Flow", source, sink);
> setValue(myFlow, "0.1*[Source]"); //10% of the source's volume moves to the sink each time period

Manipulating a Model in an IFRAME:

To access the API of an embedded IFRAME, first give the IFRAME an "id" property. This is not added by default in Insight Maker. For instance change

> <IFRAME SRC="...

to

> <IFRAME ID="InsightMakerModel1" SRC="...

Then from the parent page you can use the following JavaScript syntax to call API functions. This example calls the API's <clearModel> function.

> document.getElementById('InsightMakerModel1').contentWindow.postMessage("clearModel()", "*");


*/

