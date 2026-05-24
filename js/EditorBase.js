"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

/**
 * createEditorFieldConfig — generates the Ext.extend config object for an
 * editor form field (EquationEditor, ConverterEditor, UnitsEditor, etc.)
 *
 * Provides the standard trigger button, beforerender validator, and
 * keydown handler built in.  Works with both Ext.form.TextField and
 * Ext.form.field.TextArea as parent.
 *
 * Usage:
 *   var XxxEditor = Ext.extend(Ext.form.TextField,
 *       createEditorFieldConfig({ editorWindowClass: XxxWindow }));
 *
 *   var JsEditor = Ext.extend(Ext.form.field.TextArea,
 *       createEditorFieldConfig({ editorWindowClass: JsWindow,
 *         enableKeyEvents: true,
 *         _onKeyDown: function(f) { f.setEditable(true); }
 *       }));
 *
 * @param {Object} overrides
 *   @param {Function} overrides.editorWindowClass  — the Window constructor (required)
 *   @param {Function} [overrides.getEditorWindowConfig] — returns extra config for the window
 *   @param {Function} [overrides._onKeyDown] — override keydown behavior
 *   @param {Object}   [overrides.*] — any other Ext.form.TextField config properties
 */
function createEditorFieldConfig(overrides) {
	var onKeyDown = overrides._onKeyDown || function(field) {
		field.setEditable(false);
	};

	var getWindowConfig = overrides.getEditorWindowConfig || function() {
		return { parent: this };
	};

	return Ext.apply({
		enableKeyEvents: false,
		selectOnFocus: true,

		triggers: {
			edit: {
				hideOnReadOnly: false,
				handler: function() {
					this.editorWindow = new this.editorWindowClass(this.getEditorWindowConfig());
					this.editorWindow.show();
				}
			}
		},

		listeners: {
			'keydown': onKeyDown,
			'beforerender': function() {
				if (this.regex !== undefined) {
					this.validator = function(value) {
						return this.regex.test(value);
					};
				}
			}
		}
	}, overrides);
}


/**
 * Standard Cancel button for editor windows.
 * Usage: buttons: [ editorCancelButton(config), ... ]
 *
 * Finds the owning Ext.Window via this.up('window') at runtime.
 */
function editorCancelButton(config) {
	return {
		scale: "large",
		glyph: 0xf05c,
		text: getText('取消'),
		handler: function() {
			var win = this.up('window');
			if (win) win.close();
			if (config.parent && config.parent !== "") {
				config.parent.resumeEvents();
			}
		}
	};
}


/**
 * Standard Apply button for editor windows.
 *
 * @param {Object} config   — window config (parent, cell, etc.)
 * @param {Object} opts
 *   @param {Function} opts.getValue    — returns the edited value
 *   @param {Function} opts.saveValue   — called as saveValue(cell, value)
 *   @param {Function} [opts.afterApply] — called after save, before close
 */
function editorApplyButton(config, opts) {
	return {
		hidden: !viewConfig.allowEdits,
		scale: "large",
		glyph: 0xf00c,
		text: getText('应用'),
		handler: function() {
			var win = this.up('window');
			var value = opts.getValue();
			if (config.parent && config.parent !== "") {
				editingRecord.set("value", value);
				saveConfigRecord(editingRecord);
			} else {
				modelTransaction(function() {
					opts.saveValue(config.cell, value);
				});
				selectionChanged(false);
			}
			if (opts.afterApply) {
				opts.afterApply(config, value);
			}
			if (win) win.close();
		}
	};
}


/**
 * Common editor window factory — fills in the standard Ext.Window config
 * shared across all editor windows.
 *
 * @param {String} title   — window title
 * @param {Object} config  — the window config (parent, cell, etc.)
 * @param {Array}  items   — Ext.Component items for the window
 * @param {Object} [opts]
 *   @param {String}  [opts.stateId]     — stateId for stateful restore
 *   @param {String}  [opts.layout]      — default 'border'
 *   @param {String}  [opts.buttonAlign] — default 'left'
 *   @param {Number}  [opts.maxWidth]    — default 720
 *   @param {Number}  [opts.maxHeight]   — default 500
 *   @param {Number}  [opts.minWidth]    — default 550
 *   @param {Number}  [opts.minHeight]   — default 400
 *   @param {Array}   [opts.tools]       — header tools
 *   @param {Array}   [opts.buttons]     — button configs
 *   @param {Object}  [opts.listeners]   — window listeners
 *   @param {Object}  [opts.extra]       — merged on top (overrides all)
 */
function editorWindow(title, config, items, opts) {
	opts = opts || {};
	return new Ext.Window(Ext.apply({
		title: title,
		layout: opts.layout || 'border',
		closeAction: 'destroy',
		border: false,
		modal: true,
		resizable: true,
		maximizable: true,
		shadow: true,
		stateful: is_editor && (!is_embed),
		stateId: opts.stateId,
		buttonAlign: opts.buttonAlign || 'left',
		width: Math.min(Ext.getBody().getViewSize().width, opts.maxWidth || 720),
		height: Math.min(Ext.getBody().getViewSize().height, opts.maxHeight || 500),
		minWidth: opts.minWidth || 550,
		minHeight: opts.minHeight || 400,
		items: items,
		buttons: opts.buttons || [],
		tools: opts.tools || [],
		listeners: opts.listeners || {}
	}, opts.extra || {}));
}


/**
 * Common show + focus helper for ACE-based editor windows.
 * Returns the window for chaining.
 */
function showAndFocusEditor(win, editor) {
	win.show();
	if (editor) {
		editor.focus(true, true);
		if (editor.editor) {
			editor.editor.focus();
			setTimeout(function() {
				editor.editor.focus();
			}, 100);
		}
	}
	return win;
}
