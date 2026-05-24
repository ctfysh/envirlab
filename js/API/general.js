"use strict";
/*

Group: General Model Functions

*/

/*
Method: runModel

Runs a simulation and optionally returns the results.

Parameters:

config - A configuration object. For compatibility, if set to the Boolean value, equivalent to calling runModel with a configuration object with the silent property set to the boolean value.
config.silent - If false or undefined, behaves the same way as if the user clicked the run simulation button. If true, no visible response is shown to running the simulation and the results of the simulation are returned as an object.
config.selectedDisplay - The selected tab in the display, should be a display primitive.
config.rate - A multiplier to control the speed of the animation in the result window. Use -1 to skip animation.
config.onSuccess(results) - Callback called when the simulation completes successfully.
config.onError(results) - Callback called when an error occurs during the simulation.
config.onPause(results) - Callback called when the simulation is paused. If this is set and a pause interval is defined for the model, then the simulation will be asynchronous and a results object will not be returned directly by the function call. 

Returns:

If silent is true, returns the simulation results as a results object. If callbacks are defined, the callbacks are called with a results object. This object contains the following properties.

times - The times for each period of the simulation as an array.
value(primitive) - A function that takes a primitive reference and returns an array of the values that primitive took on over the course of the simulation.
lastValue(primitive) - A function that takes a primitive reference and returns the last value of the primitive during the simulation.
window - The results window object (if config.silent is false).
error - "none" if no simulation error occurred, otherwise an error message.
errorPrimitive - The primitive that caused the error.
resume() - If the simulation was paused, this function may be called to resume the simulation. Please note that Insight Maker currently only supports running a single simulation at a time. When a new simulation is started, any currently paused simulations will be terminated immediately.
setValue(primitive, value) - If the simulation is paused, allows changing the value of a primitive. Value can be any equation that does not depend on the model state. E.g. "{Cows: 1, Sheep: 2} * 2" is a valid Value, but "[Other Primitive] + 1" is not.
stochastic - True if the simulation contained an element of randomness.

Examples:

> # Runs a simulation, and displays the average value of the Stock named "Rabbits"
> runModel({
>   onSuccess: function(results){
>      var sum = 0;
>      for(var i = 0; i < results.times.length; i++){
>          sum += results.value(findName("Rabbits"))[i];
>      }
>      showMessage("The average value is: " + sum/results.times.length);
>   }
> })

> # Create interactive run of the model where the primitive "Rate" is adjusted each pause interval
> runModel({
> 	silent: true,
> 	onPause: function(results){
> 		console.log("Simulation Step");
> 		results.setValue(findName("Rate"), prompt("Enter New 'Rate' Value"));
>		results.resume();
> 	},
> 	onSuccess: function(results){
> 		console.log("Simulation Done");
> 		console.log(results);
> 	},
> 	onError: function(){
> 		alert("A simulation error occurred.");
> 	}
> });

*/

function runModel(config) {
	if (simulationRunning()) {
		if( (!simulate.config.silent) && (! config.resultsWindow) ){
			mxUtils.alert(getText("您有一个尚未完成的现有模拟运行。 关闭结果窗口或按窗口的“停止”按钮。 然后，您可以运行新的模拟。"));
			simulate.resultsWindow.show();
			return;
		}
	}

	if (isUndefined(config)) {
		config = {silent: graph instanceof SimpleNode};
	} else if (typeof config == 'boolean') {
		config = {
			silent: config
		};
	}
	return runSimulation(config);
}

function simulationRunning() {
	return simulate && (!simulate.completed());
}

function endRunningSimulation() {
	if (simulate) {
		simulate.terminate();
	}
}

/*
Method: saveModel

Saves the model.

Parameters:

dialogue - Pass true to show the properties dialogues (e.g. name, description, tags). The dialogue is always shown if this is the first save.

*/



function saveModel(dialogue) {
	if (dialogue || graph_title == "") {
		updateProperties();
	} else {
		if(!unfoldingManager.unfolding){
			sendGraphtoServer(graph);
		}
	}
}


/*
Method: clearModel

Removes all primitives from the model.
*/


function clearModel() {
	if(graph instanceof SimpleNode){
		graph.children[0].children[0].children = graph.children[0].children[0].children.filter(function(x){
			return x.value.nodeName == "Setting";
		});
		clearPrimitiveCache();
	}else{
		graph.getModel().beginUpdate();
		graph.allowButtonSelect = true;
		graph.selectAll();
		graph.allowButtonSelect = false;
		graph.removeCells(graph.getSelectionCells(), false);
		graph.getModel().endUpdate();
	}
}

/*
Method: layoutModel

Reorganizes the primitives in the model according to an algorithm.

Parameters:

algorithm - The algorithm used to calculate the new positions of the primitive. Either "organic" or "circular".

*/

function layoutModel(algorithm) {
	if (algorithm == "organic") {
		var layout = new mxFastOrganicLayout(graph);
		layout.forceConstant = 50;
		executeLayout(layout, true);
	} else if (algorithm == "circular") {
		executeLayout(new mxCircleLayout(graph), true);
	} else if (algorithm == "hierarchical") {
		var layout = new mxCompactTreeLayout(graph);
		layout.horizontal = false;
		layout.resizeParent = false;
		layout.moveTree = false;
		executeLayout(layout, true);
	} else {
		alert(getText("未知布局算法：") + algorithm);
	}
}

var executeLayout = function(layout, animate, ignoreChildCount) {
	var cell = graph.getSelectionCell();

	if (cell == null || (!ignoreChildCount && graph.getModel().getChildCount(cell) == 0)) {
		cell = graph.getDefaultParent();
	}

	graph.getModel().beginUpdate();
	try {
		layout.execute(cell);
	} catch (e) {
		throw e;
	} finally {
		// Animates the changes in the graph model except
		// for Camino, where animation is too slow
		if (animate && navigator.userAgent.indexOf('Camino') < 0) {
			// New API for animating graph layout results asynchronously
			var morph = new mxMorphing(graph);
			morph.addListener(mxEvent.DONE, function() {
				graph.getModel().endUpdate();
			});

			morph.startAnimation();
		} else {
			graph.getModel().endUpdate();
		}
	}

};

/*
Method: setZoom

Sets the scale of the diagram display.

Parameters:

scale - The diagram scale. If this is a number, then it determine the scale level. 1 means 100%, 0.5 means 50%, 2 means 200% and so on. You also pass one of the following strings: "fit" to fit the model to the diagram area, "actual" to reset the scale, "in" to zoom further in based on the current scale, and "out" to further out based on the current scale.

*/

function setZoom(scale) {
	if (scale == "fit") {
		graph.fit();
	} else if (scale == "actual") {
		graph.zoomActual();
	} else if (scale == "in") {
		graph.zoomIn();
	} else if (scale == "out") {
		graph.zoomOut();
	} else {
		graph.getView().setScale(scale);
	}
}


