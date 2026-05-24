"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

var JavaScriptEditor = Ext.extend(Ext.form.field.TextArea,
	createEditorFieldConfig({
		editorWindowClass: JavaScriptWindow,
		enableKeyEvents: true,
		disableKeyFilter: true,
		getEditorWindowConfig: function() {
			return { parent: this, code: this.getValue() };
		},
		_onKeyDown: function(field) {
			field.setEditable(true);
		}
	})
);

function JavaScriptWindow(config) {
	var me = this;


	var codeEditor = new Ext.ux.AceEditor({
		mode: "javascript",
		value: config.code
	});

	var win = editorWindow(getText('JavaScript编辑器'), config, [codeEditor], {
		stateId: "js_window",
		layout: "fit",
		buttonAlign: "right",
		maxWidth: 520,
		maxHeight: 400,
		buttons: [
			editorCancelButton(config),
			editorApplyButton(config, {
				getValue: function() { return codeEditor.getValue(); },
				saveValue: function(cell, val) { setNote(cell, val); }
			})
		]
	});

	me.show = function() {
		showAndFocusEditor(win, codeEditor);
	}
}
