"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

var RichTextEditor = Ext.extend(Ext.form.TextField,
	createEditorFieldConfig({
		editorWindowClass: RichTextWindow,
		getEditorWindowConfig: function() {
			return { parent: this, html: this.getValue() };
		}
	})
);


function RichTextWindow(config) {
	var me = this;


	var richEditor = new Ext.form.field.HtmlEditor({
		enableColors: false,
		enableSourceEdit: true,
		enableFont: false,
		enableLists: true,
		enableFontSize: false,
		fieldLabel: '',
		name: 'richTextItem',
		id: 'richTextItem',
		allowBlank: true,
		emptyText: getText("输入注释..."),
		value: config.html
	});

	var win = editorWindow(getText('注释编辑器'), config, [richEditor], {
		stateId: "richtext_window",
		layout: "fit",
		buttonAlign: "right",
		maxWidth: 520,
		maxHeight: 400,
		buttons: [
			editorCancelButton(config),
			editorApplyButton(config, {
				getValue: function() { return Ext.getCmp("richTextItem").getValue(); },
				saveValue: function(cell, val) { setNote(cell, val); }
			})
		]
	});

	me.show = function() {
		win.show();
	}
}
