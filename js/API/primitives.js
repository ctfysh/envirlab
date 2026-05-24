"use strict";
/*

Group: General Primitive Functions

*/

/*
Method: getID

Gets the ID of the passed primitive. The ID remains constant even if the name of a primitive changes. The ID is a string.

Parameters:

primitive - The primitive for which the ID is requested. May also be an array of primitives.

Return:

The ID of the primitive as a string. If an array of primitives was passed, returns an array of IDs.

See also:

<findID>
*/



function getID(primitive) {
	return map(primitive, function(primitive) {
		return primitive.id;
	});
}

/*
Method: getType

Gets the type of the passed primitive.

Parameters:

primitive - The primitive for which the type is requested. May also be an array of primitives.

Return:

The type of the primitive as a string. If an array of primitives was passed, returns an array of IDs.

*/



function getType(primitive) {
	return map(primitive, function(primitive) {
		return primitive.value.nodeName;
	});
}



/*
Method: getName

Gets the name of the passed primitive.

Parameters:

primitive - The primitive for which the name is requested. May also be an array of primitives.

Return:

The name of the primitive as a string. If an array of primitives was passed, returns an array of names.

See also:

<setName>
*/

function getName(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("name");
	});
}

/*
Method: setName

Sets the name of the passed primitive.

Parameters:

primitive - The primitive for which the name will be set. May also be an array of primitives in which case they will all be set to the same name.
name - The new name for the primitive.

See also:

<getName>
*/

function setName(primitive, name) {

	map(primitive, function(primitive) {
		if (validPrimitiveName(String(name), primitive)) {
			setAttributeUndoable(primitive, "name", String(name));
			propogateGhosts(primitive);
		}
	});

}

/*
Method: getUnits

Gets the units of the passed primitive.

Parameters:

primitive - The primitive for which the units are requested. May also be an array of primitives.

Return:

The units of the primitive as a string. If an array of primitives was passed, returns an array of units.

See also:

<setUnits>
*/



function getUnits(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("Units");
	});
}

/*
Method: setUnits

Sets the units of the passed primitive.

Parameters:

primitive - The primitive for which the units will be set. May also be an array of primitives in which case they will all be set to the same units.
units - The new units for the primitive.

See also:

<getUnits>
*/


function setUnits(primitive, units) {

	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "Units", String(units));
	});

}

/*
Method: getConstraints

Gets the upper and lower bounds on the passed primitive to test against during simulation.

Parameters:

primitive - The primitive for which the constraints are requested. May also be an array of primitives.

Return:

The constraints of the primitive as an array. The format is [MinimumConstraint, MinimumConstraintMode, MaximumConstraint, MaximumConstraintMode]. Constraint mode is false to disable the constraint and true to enable it.

See also:

<setConstraints>
*/


function getConstraints(primitive) {
	return map(primitive, function(primitive) {
		return [primitive.getAttribute("MinConstraint"), isTrue(primitive.getAttribute("MinConstraintUsed")), primitive.getAttribute("MaxConstraint"), isTrue(primitive.getAttribute("MaxConstraintUsed"))];
	});
}

/*
Method: setConstraints

Sets the upper and lower bounds on the passed primitive to test against during simulation.

Parameters:

primitive - The primitive for which the units will be set. May also be an array of primitives in which case they will all be set to the same constraints.
constraints - The constraints of the primitive as an array. The format is [MinimumConstraint, MinimumConstraintMode, MaximumConstraint, MaximumConstraintMode]. Constraint mode is false to disable the constraint and true to enable it.


See also:

<getConstraints>
*/


function setConstraints(primitive, constraints) {
	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "MinConstraint", constraints[0]);
		setAttributeUndoable(primitive, "MinConstraintUsed", constraints[1]);
		setAttributeUndoable(primitive, "MaxConstraint", constraints[2]);
		setAttributeUndoable(primitive, "MaxConstraintUsed", constraints[3]);
	});

}

/*
Method: getNote

Gets the note of the passed primitive.

Parameters:

primitive - The primitive for which the note is requested. May also be an array of primitives.

Return:

The note of the primitive as a string. If an array of primitives was passed, returns an array of notes.

See also:

<setNote>
*/

function getNote(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("Note");
	});
}

/*
Method: setNote

Sets the note of the passed primitive.

Parameters:

primitive - The primitive for which the note will be set. May also be an array of primitives in which case they will all be set to the same note.
note - The new note for the primitive.

See also:

<getNote>
*/

function setNote(primitive, note) {

	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "Note", String(note));
	});

}

/*
Method: showNote

Shows the note for the passed primitive. The note is shown as a closable tooltip next to the primitive. If the note is empty, the note will not be shown.

Parameters:

primitive - The primitive for which the note will be shown. May also be an array of primitives in which case they will all have their notes shown.

See also:

<hideNote>
*/



function showNote(primitive) {
	return map(primitive, function(cell) {
		if (!(cell.value.getAttribute("Note", null) === null || cell.value.getAttribute("Note") == "")) {
			var x = Ext.getCmp("note" + cell.id);
			if (isUndefined(x)) {

				var state = graph.view.getState(cell);
				if (state) {
					var tooltip = new Ext.ToolTip({
						html: "<big>" + clean(cell.value.getAttribute("Note").replace(/\n/g, "<br/>")) + "</big>",
						autoHide: false,
						closable: true,
						width: 300,
						draggable: true,
						id: "note" + cell.id,
						title: clean(cell.value.getAttribute("name")),
						closeAction: "destroy"
					});

					tooltip.showAt([state.x + mxPanel.getEl().getLeft() + state.width + 4 - graph.container.scrollLeft, state.y + mxPanel.getEl().getTop() - graph.container.scrollTop]);
				}

			}
		}
	});
}

/*
Method: hideNote

Hides the note for the passed primitive. The note is shown as a closable tooltip next to the primitive.

Parameters:

primitive - The primitive for which the note will be hidden. May also be an array of primitives in which case they will all have their notes hidden.

See also:

<showNote>
*/



function hideNote(primitive) {
	return map(primitive, function(cell) {
		var x = Ext.getCmp("note" + cell.id);
		if (!isUndefined(x)) {
			x.destroy();
		}
	});
}

/*
Method: showEditor

Shows the value editor for the passed primitive.

Parameters:

primitive - The primitive for which the editor will be shown. 
annotations - An optional array containing a list of annotations. Only valid for primitives with equations.

Example:

> showEditor(primitive, [{type: "error", row: 7, text: "Incorrect syntax"}])

*/


function showEditor(primitive, annotations) {
	if (primitive.value.nodeName == "Converter") {
		var editorWindow = new ConverterWindow({
			parent: "",
			cell: primitive,
			oldKeys: primitive.getAttribute("Data"),
			interpolation: primitive.getAttribute("Interpolation")
		});
		editorWindow.show();
	} else if(primitive.value.nodeName == "Stock"){
		var checkbox = new Ext.form.field.Checkbox({
			xtype: "checkboxfield",
			boxLabel: getText('将此库存限制为正值'),
			checked: getNonNegative(primitive),
			autoEl: {
                'data-qtip': "如果选中，则不允许库的值低于零。 可以调整流出率以确保满足该条件。"
            }
		});
				
		var editorWindow = new EquationWindow({
			parent: "",
			cell: primitive,
			equation: getValue(primitive),
			annotations: annotations,
			extra: checkbox,
			saveExtra: function(extra){
				setNonNegative(primitive, checkbox.getValue())
			}
		});
		editorWindow.show();
	} else if(primitive.value.nodeName == "Flow"){
		var checkbox = new Ext.form.field.Checkbox({
			xtype: "checkboxfield",
			boxLabel: getText('将此流量限制为正值'),
			checked: getNonNegative(primitive),
			autoEl: {
                'data-qtip': "如果选中，则如果计算的速率小于零，则不会应用流量。"
            }
		});
				
		var editorWindow = new EquationWindow({
			parent: "",
			cell: primitive,
			equation: getValue(primitive),
			annotations: annotations,
			extra: checkbox,
			saveExtra: function(extra){
				setNonNegative(primitive, checkbox.getValue());
			}
		});
		editorWindow.show();
	} else if(primitive.value.nodeName == "Transition"){
		var testVisibility = function(){
			var cond = trigger.getValue() == "Condition";
			recalculate.setDisabled(cond);
			repeat.setDisabled(cond);
		}
		
		var trigger = new Ext.form.ComboBox({
			triggerAction: "all",
			store: [
				['Timeout', '超时'],
				['Probability', '概率'],
				['Condition', '条件']
			],
			valueField: 'field1',
			displayField: 'field2',
			editable: false,
			selectOnFocus: false,
			value: getTriggerType(primitive),
			fieldLabel: getText('触发器类型'),
			width: 240,
			listeners: {
				change: function(){
					testVisibility();
				}
			}
		});
		
		var recalculate = new Ext.form.field.Checkbox({
			xtype: "checkboxfield",
			boxLabel: getText('重新计算每个时间步'),
			checked: getTriggerRecalculate(primitive),
			margin: '0 0 0 15',
			autoEl: {
                'data-qtip': "如果不是这样，则将对等式进行一次评估，并根据该计算调度触发时间。 如果是这样，则会在系统状态发生变化时重新计算超时或概率。"
            }
		});
		
		var repeat = new Ext.form.field.Checkbox({
			xtype: "checkboxfield",
			boxLabel: getText('触发后重复'),
			checked: getTriggerRepeat(primitive),
			margin: '0 0 0 15',
			autoEl: {
                'data-qtip': "如果是这样，则在触发转换后将重新安排转换。 如果不是这样，则只有在源状态再次变为活动状态时才会重新调度转换。"
            }
		});
		
		var items = {
			xtype: 'container',
			layout: 'hbox',
			items: [trigger, recalculate, repeat]
		}
				
		testVisibility();
		
		var editorWindow = new EquationWindow({
			parent: "",
			cell: primitive,
			equation: getValue(primitive),
			annotations: annotations,
			extra: items,
			saveExtra: function(extra){
				setTriggerType(primitive, trigger.value);
				setTriggerRecalculate(primitive, recalculate.getValue());
				setTriggerRepeat(primitive, repeat.getValue());
			}
		});
		editorWindow.show();
	} else {
		var editorWindow = new EquationWindow({
			parent: "",
			cell: primitive,
			equation: getValue(primitive),
			annotations: annotations
		});
		editorWindow.show();
	}
}

/*
Method: getValue

Gets the value of the passed primitive. The value depends on the type of the primitive. For instance, the value of stock is its initial value while the value of a flow is its rate.

Parameters:

primitive - The primitive for which the value is requested. May also be an array of primitives.

Return:

The value of the primitive as a string. If an array of primitives was passed, returns an array of values.

See also:

<setValue>
*/



function getValue(primitive) {
	return map(primitive, function(primitive) {
		var n = primitive.value.nodeName;
		var v;
		if (n == "Stock") {
			v = primitive.getAttribute("InitialValue");
		} else if (n == "Flow") {
			v = primitive.getAttribute("FlowRate");
		} else if (n == "Transition") {
			v = primitive.getAttribute("Value");
		} else if (n == "State") {
			v = primitive.getAttribute("Active");
		} else if (n == "Variable") {
			v = primitive.getAttribute("Equation");
		} else if (n == "Button") {
			v = primitive.getAttribute("Function");
		} else if (n == "Converter") {
			v = primitive.getAttribute("Data");
		} else if (n == "Action") {
			v = primitive.getAttribute("Action");
		} else if (n == "Agents") {
			v = primitive.getAttribute("Size");
		}
		if (isDefined(v)) {
			return v;
		} else {
			return "";
		}
	});
}

/*
Method: setValue

Sets the value of the passed primitive. The value depends on the type of the primitive. For instance, the value of stock is its initial value while the value of a flow is its rate.

Parameters:

primitive - The primitive for which the value will be set. May also be an array of primitives in which case they will all be set to the same value.
value - The new value for the primitive. Can be a number or a string.

See also:

<getValue>
*/


function setValue(primitive, value) {

	map(primitive, function(primitive) {
		if (getValue(primitive) != value) {
			var n = primitive.value.nodeName;
			if (n == "Stock") {
				setAttributeUndoable(primitive, "InitialValue", String(value));
			} else if (n == "Flow") {
				setAttributeUndoable(primitive, "FlowRate", String(value));
			} else if (n == "Transition") {
				setAttributeUndoable(primitive, "Value", String(value));
			} else if (n == "State") {
				setAttributeUndoable(primitive, "Active", String(value));
			} else if (n == "Variable") {
				setAttributeUndoable(primitive, "Equation", String(value));
			} else if (n == "Button") {
				setAttributeUndoable(primitive, "Function", String(value));
			} else if (n == "Converter") {
				setAttributeUndoable(primitive, "Data", String(value));
			} else if (n == "Action") {
				setAttributeUndoable(primitive, "Action", String(value));
			} else if (n == "Agents") {
				if (value < 0 || Math.round(value) != value) {
					alert(getText("主体种群大小必须为非负整数。"));
					return;
				}
				setAttributeUndoable(primitive, "Size", parseFloat(value));
			}


		}
	});

}

/*
Method: getSize

Gets the size of the passed primitive.

Parameters:

primitive - The primitive for which the position is requested. May also be an array of primitives.

Return:

The size as an array of the form: [width, height].

*/



function getSize(primitive) {
	return map(primitive, function(primitive) {
		if(graph instanceof SimpleNode){
			return [0,0];
		}
		var size = graph.getCellBounds(primitive);
		var scale = graph.view.getScale();

		return [size.width / scale, size.height / scale];
	});
}


/*
Method: getPosition

Gets the position of the passed primitive.

Parameters:

primitive - The primitive for which the position is requested. May also be an array of primitives.

Return:

The position as an array of the form [x, y]. The position is measured from the top-left corner of the graph.

See also:

<setPosition>
*/



function getPosition(primitive) {
	return map(primitive, function(primitive) {
		if(graph instanceof SimpleNode){
			return [0,0];
		}
		var state = graph.view.getState(primitive);
		var scale = graph.view.getScale();

		return [state.x / scale, state.y / scale];
	});
}

/*
Method: setPosition

Sets the position of the passed primitive.

Parameters:

primitive - The primitive for which the position will be set. May also be an array of primitives in which case they will all be set to the same position.
position - The new position for the primitive in the form [x, y]. The position is measured from the top-left corner of the graph.

See also:

<getPosition>
*/


function setPosition(primitive, position) {

	map(primitive, function(primitive) {
		var state = graph.view.getState(primitive);

		var scale = graph.view.getScale();

		var geo = primitive.geometry;

		var dx = state.x / scale - geo.x;
		var dy = state.y / scale - geo.y;

		var res = geo.clone();

		res.x = position[0] - dx;
		res.y = position[1] - dy;

		graph.getModel().setGeometry(primitive, res);
	});

}

