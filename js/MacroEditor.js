"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

// ====== Macro/Function Editor ======

// Shows the macros (global variables/functions) editor dialog
var showMacros = function(annotations) {
	var equationEditor = new Ext.ux.AceEditor({
		id: 'macroTxt',
		name: 'macroTxt',
		readOnly: !viewConfig.allowEdits,
		flex: 1,
		value: getSetting().getAttribute("Macros"),
		annotations: annotations
	});

	var macrosWin = new Ext.Window({
		layout: {
			type: 'vbox',
			align: 'stretch'
		},
		tools: [],
		modal: true,
		stateful: is_editor && (!is_embed),
		stateId: "macros_window",
		width: Math.min(Ext.getBody().getViewSize().width, 540),
		height: Math.min(Ext.getBody().getViewSize().height, 450),
		title: getText("模型宏"),
		resizable: true,
		maximizable: true,
		closeAction: 'destroy',
		plain: true,
		items: [
			equationEditor,

			{
				xtype: "box",
				padding: 8,
				style: {
					"border-top": "solid 1px lightgrey"
				},
				html: "<b>" + getText('示例宏') + "</b><br>g <- {9.80665 meters/seconds^2} # 自定义变量<br/>TemperatureFtoC(f) <- (f+32)*5/9 # 自定义函数<br/>"
			}
		],

		buttons: [{
				scale: "large",
				glyph: 0xf05c,
				text: getText('取消'),
				handler: function() {
					macrosWin.close();
				}
			}, {
				glyph: 0xf00c,
				scale: "large",
				text: getText('应用'),
				handler: function() {

					setModelAttribute(getSetting(), "Macros", Ext.getCmp('macroTxt').getValue());

					macrosWin.close();

				}
			}

		]
	});

	macrosWin.show();

	equationEditor.focus(true, true);
	equationEditor.editor.focus();
	setTimeout(function() {
		equationEditor.editor.focus();
	}, 200);
};
