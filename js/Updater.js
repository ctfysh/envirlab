"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/


function updateModel(){

	var mySetting = getSetting();

	if (mySetting.getAttribute("Version") < 3) {
		var converters = primitives("Converter");
		for (var i = 0; i < converters.length; i++) {
			var inps = converters[i].getAttribute("Inputs").split(",");
			var outs = converters[i].getAttribute("Outputs").split(",");
			var s = "";
			for (var j = 0; j < inps.length; j++) {
				if (j > 0) {
					s = s + ";";
				}
				s = s + inps[j] + "," + outs[j];
			}
			converters[i].setAttribute("Data", s);
		}
		mySetting.setAttribute("Version", 3);
	}
	if (mySetting.getAttribute("Version") < 4) {
		mySetting.setAttribute("SolutionAlgorithm", "RK1");
		mySetting.setAttribute("Version", 4)
	}

	if (mySetting.getAttribute("Version") < 5) {
		var stocks = primitives("Stock");
		for (var i = 0; i < stocks.length; i++) {
			stocks[i].setAttribute("NonNegative", false);
		}
		mySetting.setAttribute("Version", 5);
	}

	if (mySetting.getAttribute("Version") < 6) {
		var pictures = primitives("Picture");
		for (var i = 0; i < pictures.length; i++) {
			pictures[i].setAttribute("FlipHorizontal", false);
			pictures[i].setAttribute("FlipVertical", false);
		}
		mySetting.setAttribute("Version", 6);
	}

	if (mySetting.getAttribute("Version") < 7) {
		var links = primitives("Link");
		for (var i = 0; i < links.length; i++) {
			links[i].setAttribute("BiDirectional", false);
		}
		mySetting.setAttribute("Version", 7);
	}

	if (mySetting.getAttribute("Version") < 8) {
		var items = primitives("Stock").concat(primitives("Parameter"), primitives("Converter"));
		for (var i = 0; i < items.length; i++) {
			items[i].setAttribute("Image", "None");
		}
		items = primitives("Display");
		for (var i = 0; i < items.length; i++) {
			items[i].setAttribute("Image", "Display");
		}
		mySetting.setAttribute("Version", 8);
	}

	if (mySetting.getAttribute("Version") < 9) {
		mySetting.setAttribute("BackgroundColor", "white");
		mySetting.setAttribute("Version", 9);
	}

	if (mySetting.getAttribute("Version") < 10) {
		var displays = primitives("Display");

		for (var i = 0; i < displays.length; i++) {
			displays[i].setVisible(false);
		}
		mySetting.setAttribute("Version", 10);
		graph.refresh()
	}

	if (mySetting.getAttribute("Version") < 11) {
		var cells = primitives("Stock").concat(primitives("Parameter"), primitives("Converter"), primitives("Text"));

		if(! (graph instanceof SimpleNode)){
			graph.setCellStyles(mxConstants.STYLE_LABEL_BACKGROUNDCOLOR, mxConstants.NONE, cells);
		}

		mySetting.setAttribute("Version", 11);
	}

	if (mySetting.getAttribute("Version") < 12) {
		var cells = primitives("Stock").concat(primitives("Parameter"), primitives("Converter"));
		var pics = primitives("Picture");

		for (var i = 0; i < pics.length; i++) {
			pics[i].setAttribute("LabelPosition", "Bottom");
		}

		for (var i = 0; i < cells.length; i++) {
			cells[i].setAttribute("LabelPosition", "Middle");
		}

		mySetting.setAttribute("Version", 12);
	}

	if (mySetting.getAttribute("Version") < 13) {
		var items = primitives("Folder");
		for (var i = 0; i < items.length; i++) {
			items[i].setAttribute("Image", "None");
			items[i].setAttribute("LabelPosition", "Middle");
		}
		mySetting.setAttribute("Version", 13);
	}

	if (mySetting.getAttribute("Version") < 14) {
		var pictures = primitives("Stock").concat(primitives("Parameter"), primitives("Converter"), primitives("Folder"));
		for (var i = 0; i < pictures.length; i++) {
			pictures[i].setAttribute("FlipHorizontal", false);
			pictures[i].setAttribute("FlipVertical", false);
		}
		mySetting.setAttribute("Version", 14);
	}

	if (mySetting.getAttribute("Version") < 15) {
		var buttons = primitives("Button");
		for (var i = 0; i < buttons.length; i++) {
			var action = buttons[i].getAttribute("Function");
			action = action.replace(/getName/g, "findName");
			action = action.replace(/getType/g, "findType");
			action = action.replace(/getAll/g, "findAll");
			buttons[i].setAttribute("Function", action);
		}
		mySetting.setAttribute("Version", 15);
	}

	if (mySetting.getAttribute("Version") < 16) {
		var vars = primitives("Parameter");
		for (var i = 0; i < vars.length; i++) {
			vars[i].value = changeNodeName(vars[i].value, "Variable");
		}
		mySetting.setAttribute("Version", 16);
	}

	if (mySetting.getAttribute("Version") < 17) {
		mySetting.setAttribute("Throttle", -1);
		mySetting.setAttribute("Version", 17);
	}

	if (mySetting.getAttribute("Version") < 18) {
		var displays = primitives("Display");

		for (var i = 0; i < displays.length; i++) {
			displays[i].setAttribute("yAxis2", "");
			displays[i].setAttribute("Primitives2", "");
		}

		mySetting.setAttribute("Version", 18);

	}

	if (mySetting.getAttribute("Version") < 19) {
		mySetting.setAttribute("Macros", "");
		mySetting.setAttribute("Version", 19);
	}

	if (mySetting.getAttribute("Version") < 20) {
		var u = mySetting.getAttribute("Units");
		if (isDefined(u)) {
			mySetting.setAttribute("Units", u.replace(/,/g, "*"));
		}
		mySetting.setAttribute("Version", 20);
	}

	if (mySetting.getAttribute("Version") < 21) {
		var displays = primitives("Display");
		for (var i = 0; i < displays.length; i++) {
			if (displays[i].getAttribute('Type') == "Scatterplot") {
				displays[i].setAttribute("showMarkers", true);
				displays[i].setAttribute("showLines", false);
			} else {
				displays[i].setAttribute("showMarkers", false);
				displays[i].setAttribute("showLines", true);
			}
		}

		mySetting.setAttribute("Version", 21);
	}


	if (mySetting.getAttribute("Version") < 22) {

		mySetting.setAttribute("SensitivityPrimitives", "");
		mySetting.setAttribute("SensitivityRuns", 50);
		mySetting.setAttribute("SensitivityBounds", "50, 80, 95, 100");
		mySetting.setAttribute("SensitivityShowRuns", "false");

		mySetting.setAttribute("Version", 22);
	}

	if (mySetting.getAttribute("Version") < 23) {

		var obsolete = findValue([/\bmin\(\s*</i, /\bmax\(\s*</i, /\bmean\(\s*</i, /\bmedian\(\s*</i, /\bstddev\(\s*</i]);

		if (obsolete.length > 0) {
			if(window.Ext){
				var msg = getText('<p>Insight Maker 已进行更新，不再需要使用 <i>&lt;Primitive&gt;</i> 符号。您现在可以使用 <i>[Primitive]</i> 替代它。</p>');
				msg += getText('<br/><p>此更新的副作用是，用于聚合图元历史数据的 Min()、Max()、Mean()、Median() 和 StdDev() 统计函数已重命名为 PastMin()、PastMax() 等（这些函数用于值计算时不受影响，例如 Max(1, 4, 2) 仍然正确）。</p>');
				msg += getText('<br/><p>要修正此问题，您需要更改如下方程：</p>');
				msg += '<br/><b>Max(&lt;x&gt;)</b></p>';
				msg += getText('<br/>改为</p>');
				msg += '<br/><b>PastMax([x])</b></p>';
				msg += getText('<br/><p>以下图元似乎使用了这些函数，需要更新才能与此更改一起正常工作。您可以手动调整其方程：</p>');
				msg += '<br/><p><b>' + Ext.Array.map(obsolete, function(x) {
					return x.getAttribute("name")
				}).join(", ") + '</b></p>';

				Ext.Msg.show({
					icon: Ext.MessageBox.WARNING,
					title: getText('模型需要更新'),
					msg: msg,
					buttons: Ext.MessageBox.OK
				});
			}
			

		}


		mySetting.setAttribute("Version", 23);
	}

	if (mySetting.getAttribute("Version") < 24) {
	
		var folders = primitives("Folder");
		for (var i = 0; i < folders.length; i++) {
			folders[i].setAttribute("Type", "None");
		}
	
		var displays = primitives("Display");
		for (var i = 0; i < displays.length; i++) {
			displays[i].setAttribute("showArea", false);
		}
	
		var texts = primitives("Text");
		for (var i = 0; i < texts.length; i++) {
			texts[i].setAttribute('LabelPosition', "Middle");
		}

		mySetting.setAttribute("Version", 24);
	}


	if (mySetting.getAttribute("Version") < 25) {
	
		if(!(graph instanceof SimpleNode )){
			setAllConnectable();
		}

		mySetting.setAttribute("Version", 25);
	}

	if (mySetting.getAttribute("Version") < 26) {
	
		var flows = primitives("Flow");
		for (var i = 0; i < flows.length; i++) {
			if(! (graph instanceof SimpleNode)){
		        if (! isTrue(flows[i].getAttribute("OnlyPositive"))) {
		            graph.setCellStyles(mxConstants.STYLE_STARTARROW, "block", [flows[i]]);
		            graph.setCellStyles("startFill", 0, [flows[i]]);
		        }
			}
	        
		}
	

		mySetting.setAttribute("Version", 26);
	}

	if (mySetting.getAttribute("Version") < 27) {
	
	
		var displays = primitives("Display");
		for (var i = 0; i < displays.length; i++) {
			displays[i].setAttribute("legendPosition", "Automatic");
		}
	
		mySetting.setAttribute("Version", 27);
	}

	if (mySetting.getAttribute("Version") < 28) {
	
		var items = primitives();
		for (var i = 0; i < items.length; i++) {
			if("ShowSlider" in items[i]){
				items[i].setAttribute("SliderStep", "");
			}
		}
	
		mySetting.setAttribute("Version", 28);
	}

	if (mySetting.getAttribute("Version") < 29) {

		var obsolete = excludeType(findValue(/[A-Za-z0-9_]\s+\(/i), "Button");
		if(window.Ext){
			if(viewConfig.allowEdits){
				if (obsolete.length > 0) {

					var msg = getText('<p>Insight Maker 对其方程引擎进行了重大更新，提供了更高的灵活性和功能。</p>');
					msg += getText('<br/><p>此更新的副作用是，函数名现在必须紧跟括号。例如，"Max&nbsp;&nbsp(1,2)" 不再有效，需要替换为 "Max(1,2)"。这也提高了方程的清晰度和可读性。</p>');
					msg += getText('<br/><p>以下图元似乎使用了不支持的格式。它们的方程将自动更新为正确格式：</p>');
					msg += '<br/><p><b>' + Ext.Array.map(obsolete, function(x) {
						return x.getAttribute("name")
					}).join(", ") + '</b></p>';
		
			msg += getText('<br/><p>您可以保存模型以保留这些更新。</p>')

				Ext.Msg.show({
					icon: Ext.MessageBox.WARNING,
					title: getText('模型需要更新'),
					msg: msg,
					buttons: Ext.MessageBox.OK
				});

			}
		}
	}

		if(obsolete.length>0){
			obsolete.map(function(x){
				setValue(x, getValue(x).replace(/([A-Za-z0-9_])\s+\(/gi, "$1("));
			});
		}

		mySetting.setAttribute("Version", 29);
	}

	if (mySetting.getAttribute("Version") < 34) {

		var obsolete = excludeType(findValue(/\[self\]/i), "Button");

		if(window.Ext){
			if(viewConfig.allowEdits){
				if (obsolete.length > 0) {

					var msg = getText('<p>Insight Maker 对其方程引擎进行了重大更新，改进了基于主体的建模。</p>');
					msg += getText('<br/><p>此更新的副作用是，"Self" 主体必须始终使用变量语法 -- <i>Self</i> -- 而不是旧的图元语法 -- <i>[Self]</i>。</p>');
					msg += getText('<br/><p>以下图元似乎使用了过时的格式。它们的方程将自动更新为正确格式：</p>');
					msg += '<br/><p><b>' + Ext.Array.map(obsolete, function(x) {
						return x.getAttribute("name")
					}).join(", ") + '</b></p>';
		
msg += getText('<br/><p>您可以保存模型以保留这些更新。</p>')

				Ext.Msg.show({
					icon: Ext.MessageBox.WARNING,
					title: getText('模型需要更新'),
					msg: msg,
					buttons: Ext.MessageBox.OK
				});

			}
		}
	}

		mySetting.setAttribute("Version", 34);
	}
	
	if (mySetting.getAttribute("Version") < 35) {

		mySetting.setAttribute("article", '{"comments":true, "facebookUID": ""}');

		mySetting.setAttribute("Version", 35);
	}
	
	if (mySetting.getAttribute("Version") < 36) {

		mySetting.setAttribute("StyleSheet", '{}');

		mySetting.setAttribute("Version", 36);
	}

}