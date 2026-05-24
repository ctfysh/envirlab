"use strict";
/*

Copyright 2010-2018 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

// Property panel generator - renders config panel fields based on selected primitive type
// Each build*Props() function mutates 'properties' (pushing items) and returns a bottomDesc string.

// ── Local helpers ──────────────────────────────────────────────────────────

function graphPrimitiveRenderer(prims) {
	var items = prims.split(",");

	var myCells = primitives();
	if (myCells != null) {
		for (var i = 0; i < myCells.length; i++) {
			if (Ext.Array.indexOf(items, myCells[i].id) > -1) {
				items[Ext.Array.indexOf(items, myCells[i].id)] = myCells[i].getAttribute("name");
			}
		}
	}
	return items.join(", ");
};

// ── Type-specific property builders ─────────────────────────────────────────

function buildStockProps(cell, properties, descBase) {
	var bottomDesc = descBase + getText('库存（Stock）存储材料或资源。湖泊和银行账户都是库存的例子。一个储存水，另一个储存金钱。初始值（Initial Value）定义了库存中最初有多少物质。');
	properties.push({
		'name': 'InitialValue',
		'text': getText('值初始化') + ' =',
		'value': cell.getAttribute("InitialValue"),
		'group': ' ' + getText('配置'),
		'editor': new EquationEditor({}),
		'renderer': equationRenderer
	});

	properties.push({
		'name': 'AllowNegatives',
		'text': getText('允许负值'),
		'value': !isTrue(cell.getAttribute("NonNegative")),
		'group': ' ' + getText('配置')
	});

	properties.push({
		'name': 'StockMode',
		'text': getText('库类型'),
		'value': cell.getAttribute("StockMode"),
		'group': getText('行为'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			store: [
				['Store', getText("存储")],
				['Conveyor', getText("输送")]
			],
			selectOnFocus: false,
			editable: false
		})
	});
	properties.push({
		'name': 'Delay',
		'text': getText('延迟'),
		'value': isDefined(cell.getAttribute("Delay")) ? cell.getAttribute("Delay").toString() : "",
		'group': getText('行为'),
		'renderer': equationRenderer
	});
	return bottomDesc;
}

function buildVariableProps(cell, properties, descBase) {
	var bottomDesc = descBase + "变量是模型中动态更新的对象，它合成可用数据或提供常量值以供方程式使用。 人口的出生率或湖泊中的最大水量都是变量的可能用途。";
	properties.push({
		'name': 'Equation',
		'text': getText('值/等式') + ' =',
		'value': cell.getAttribute("Equation"),
		'group': ' ' + getText('配置'),
		'editor': new EquationEditor({}),
		'renderer': equationRenderer
	});
	return bottomDesc;
}

function buildLinkProps(cell, properties, descBase) {
	var bottomDesc = descBase + "链接连接模型的不同部分。 如果模型中的一个图元在其等式中引用另一个图元，则两个图元必须直接连接或通过链接连接。 一旦与链接连接，方括号可用于引用其他图元的值。 因此，如果您有一个名为<i>银行余额</ i>的股票，您可以使用<i> [银行余额] </ i>在另一个图元的等式中引用它。";
	properties.push({
		'name': 'BiDirectional',
		'text': getText('双向'),
		'value': isTrue(cell.getAttribute("BiDirectional")),
		'group': ' ' + getText('配置')
	});
	return bottomDesc;
}

function buildFolderProps(cell, properties, descBase) {
	var bottomDesc = descBase + "文件夹以逻辑方式将类似项目组合在一起。 您可以折叠和展开文件夹以隐藏或显示模型复杂性。";
	properties.push({
		'name': 'Type',
		'text': getText('行为'),
		'value': cell.getAttribute("Type"),
		'group': getText('主体'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			store: [
				['None', getText('无')],
				['Agent', getText('主体')]
			],
			editable: false,
			selectOnFocus: false
		})
	});
	properties.push({
		'name': 'Solver',
		'text': getText('时间设置'),
		'value': cell.getAttribute("Equation"),
		'group': ' ' + getText('配置'),
		'renderer': renderTimeBut
	});

	properties.push({
		'name': 'Frozen',
		'text': getText('冻结'),
		'value': isTrue(cell.getAttribute("Frozen")),
		'group': ' ' + getText('配置')
	});

	properties.push({
		'name': 'AgentBase',
		'text': getText('主体父类'),
		'value': cell.getAttribute("AgentBase"),
		'group': getText('主体'),
		'editor': new EquationEditor({
			help: "此等式应返回将成为代理的父类的对象。 此对象可用于使用编程代码增强代理的功能。"
		}),
		'renderer': equationRenderer
	});
	return bottomDesc;
}

function buildButtonProps(cell, properties, descBase) {
	var bottomDesc = descBase + "按钮用于交互。 要在不触发其操作的情况下选择按钮，请在单击按钮时按住Shift键。 按钮目前处于测试阶段，其实施可能会在更高版本的Insight Maker中发生变化。";

	properties.push({
		'name': 'Function',
		'text': getText('动作'),
		'value': cell.getAttribute("Function"),
		'group': ' ' + getText('配置'),
		'editor': new JavaScriptEditor({})
	});
	return bottomDesc;
}

function buildFlowProps(cell, properties, descBase) {
	var bottomDesc = descBase + "流量表示材料从一个库存转移到另一个库存。 例如，考虑到湖泊的情况，湖泊的流量可能是：河流入流，河流流出，降水和蒸发。 流量给定流量，并且它们在一个单位时间内操作; 实际上：每秒或每一分钟的流量。";
	properties.push({
		'name': 'FlowRate',
		'text': getText('流速率') + ' =',
		'value': cell.getAttribute("FlowRate"),
		'group': ' ' + getText('配置'),
		'editor': new EquationEditor({}),
		'renderer': equationRenderer
	});
	properties.push({
		'name': 'OnlyPositive',
		'text': getText('只有正速率'),
		'value': isTrue(cell.getAttribute("OnlyPositive")),
		'group': ' ' + getText('配置')
	});
	return bottomDesc;
}

function buildTransitionProps(cell, properties, descBase) {
	var bottomDesc = descBase + "在各状态之间转换主体。 您可以根据某些条件，概率或超时触发转换。";
	properties.push({
		'name': 'Trigger',
		'text': getText('触发'),
		'value': cell.getAttribute("Trigger"),
		'group': ' ' + getText('配置'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			store: [
				['Timeout', '超时'],
				['Probability', '概率'],
				['Condition', '条件']
			],
			valueField: 'field1',
			displayField: 'field2',
			editable: false,
			selectOnFocus: false
		})
	});
	properties.push({
		'name': 'Value',
		'text': getText('值') + ' =',
		'value': cell.getAttribute("Value"),
		'group': ' ' + getText('配置'),
		'editor': new EquationEditor({}),
		'renderer': equationRenderer
	});

	properties.push({
		'name': 'Repeat',
		'text': getText('重复'),
		'value': isTrue(cell.getAttribute("Repeat")),
		'group': ' ' + getText('配置')
	});
	properties.push({
		'name': 'Recalculate',
		'text': getText('重新计算'),
		'value': isTrue(cell.getAttribute("Recalculate")),
		'group': ' ' + getText('配置')
	});
	return bottomDesc;
}

function buildActionProps(cell, properties, descBase) {
	var bottomDesc = descBase + "动作图元可用于执行某些操作，例如转换主体或动态创建它们之间的连接。";
	properties.push({
		'name': 'Trigger',
		'text': getText('触发'),
		'value': cell.getAttribute("Trigger"),
		'group': ' ' + getText('配置'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			store: [
				['Timeout', '超时'],
				['Probability', '概率'],
				['Condition', '条件']
			],
			valueField: 'field1',
			displayField: 'field2',
			editable: false,
			selectOnFocus: false
		})
	});
	properties.push({
		'name': 'Value',
		'text': getText('触发值') + ' =',
		'value': cell.getAttribute("Value"),
		'group': ' ' + getText('配置'),
		'editor': new EquationEditor({
			help: function(config){
		var cell = config.cell;
		if(cell.getAttribute("Trigger") == "Probability"){
			return "您已为此操作选择了<i>概率</i>触发器。这个方程的值是每单位时间内动作发生的概率。您可以更改触发器类型。";
		}else if(cell.getAttribute("Trigger") == "Condition"){
			return "您已经为此操作选择了<i>条件</i>触发器。当方程的计算结果为<tt>True</tt>时，将发生动作。您可以更改触发器类型。";
		}else if(cell.getAttribute("Trigger") == "Timeout"){
			return "您已经为此操作选择了<i>超时</i>触发器。这个动作将在这个方程式指定的时间过后发生。您可以更改触发器类型。";
		}
	}
		}),
		'renderer': equationRenderer
	});
	properties.push({
		'name': 'Action',
		'text': getText('动作') + ' =',
		'value': cell.getAttribute("Action"),
		'group': ' ' + getText('配置'),
		'editor': new EquationEditor({}),
		'renderer': equationRenderer
	});
	properties.push({
		'name': 'Repeat',
		'text': getText('重复'),
		'value': isTrue(cell.getAttribute("Repeat")),
		'group': ' ' + getText('配置')
	});
	properties.push({
		'name': 'Recalculate',
		'text': getText('重新计算'),
		'value': isTrue(cell.getAttribute("Recalculate")),
		'group': ' ' + getText('配置')
	});
	return bottomDesc;
}

function buildStateProps(cell, properties, descBase) {
	var bottomDesc = descBase + "图元代表一个主体的状态。布尔值yes / no属性。您可以将状态与过渡连接起来，从而让主体在状态之间移动。";

	properties.push({
		'name': 'Active',
		'text': getText('开始激活') + ' = ',
		'value': cell.getAttribute("Active"),
		'group': ' ' + getText('配置'),
		'editor': new EquationEditor({}),
		'renderer': equationRenderer
	});

	properties.push({
		'name': 'Residency',
		'text': getText('驻留') + ' = ',
		'value': cell.getAttribute("Residency"),
		'group': ' ' + getText('配置'),
		'editor': new EquationEditor({
			help: "即使要停止状态，状态仍将保持活动状态的时间长度。"
		}),
		'renderer': equationRenderer
	});
	return bottomDesc;
}

function buildAgentsProps(cell, properties, descBase) {
	var bottomDesc = descBase + "主体群表示主体的集合：单个用于模拟的互相交互的实体。";

	var dat = [];
	var folders = primitives("Folder");
	for (var i = 0; i < folders.length; i++) {
		if (folders[i].getAttribute("Type") == "Agent" /*&& connected(folders[i],cell)*/ ) {
			dat.push([folders[i].id, clean(folders[i].getAttribute("name"))])
		}
	}

	var agentStore = new Ext.data.ArrayStore({
		fields: ['myId', 'displayText'],
		data: dat
	});

	properties.push({
		'name': 'Agent',
		'text': getText('主体基'),
		'value': cell.getAttribute("Agent"),
		'group': ' ' + getText('配置'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			queryMode: 'local',
			store: agentStore,
			selectOnFocus: false,
			valueField: 'myId',
			editable: false,
			displayField: 'displayText'
		}),
		'renderer': graphPrimitiveRenderer
	});

	properties.push({
		'name': 'Size',
		'text': getText('群规模'),
		'value': cell.getAttribute("Size"),
		'group': ' ' + getText('配置'),
		'editor': {
			xtype: 'numberfield',
			minValue: 0,
			allowDecimals: false
		}
	});

	properties.push({
		'name': 'GeoWidth',
		'text': getText('宽度'),
		'value': cell.getAttribute("GeoWidth"),
		'group': ' ' + getText('几何'),
		'editor': new EquationEditor({
			help: "群的二维空间地理宽度。"
		}),
		renderer: equationRenderer
	});

	properties.push({
		'name': 'GeoHeight',
		'text': getText('高度'),
		'value': cell.getAttribute("GeoHeight"),
		'group': ' ' + getText('几何'),
		'editor': new EquationEditor({
			help: "群二维空间地理的高度。"
		}),
		renderer: equationRenderer
	});

	properties.push({
		'name': 'GeoDimUnits',
		'text': getText('尺寸单位'),
		'value': cell.getAttribute("GeoDimUnits"),
		'group': ' ' + getText('几何'),
		'editor': new UnitsEditor({})
	});

	properties.push({
		'name': 'GeoWrap',
		'text': getText('环绕'),
		'value': isTrue(cell.getAttribute("GeoWrap")),
		'group': ' ' + getText('几何')
	});

	properties.push({
		'name': 'Placement',
		'text': getText('安置方法'),
		'value': cell.getAttribute("Placement"),
		'group': ' ' + getText('几何'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			queryMode: 'local',
			selectOnFocus: false,
			editable: false,
			store: [
				["Random", getText("随机")],
				["Grid", getText("网格")],
				["Ellipse", getText("椭圆")],
				["Network", getText("网络")],
				["Custom Function", getText("自定义函数")]
			]
		}),
		'renderer': graphPrimitiveRenderer
	});

	properties.push({
		'name': 'PlacementFunction',
		'text': getText('自定义函数'),
		'value': cell.getAttribute("PlacementFunction"),
		'group': ' ' + getText('几何'),
		'editor': new EquationEditor({
			help: "对于每个主体，该等式被评估一次。 它应返回一个表示初始位置的双元素向量，格式为<tt> {x，y} </ tt>。"
		}),
		renderer: equationRenderer
	});

	properties.push({
		'name': 'Network',
		'text': getText('网络结构'),
		'value': cell.getAttribute("Network"),
		'group': ' ' + getText('网络'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			queryMode: 'local',
			selectOnFocus: false,
			editable: false,
			store: [
				["None", getText("无")],
				["Custom Function", getText("自定义函数")]
			]
		})
	});

	properties.push({
		'name': 'NetworkFunction',
		'text': getText('自定义函数'),
		'value': cell.getAttribute("NetworkFunction"),
		'group': ' ' + getText('网络'),
		'editor': new EquationEditor({
			help: "在模拟开始时，对每对主体评估该等式一次。 可以使用变量<tt> a </ tt>和<tt> b </ tt>在等式中引用这两个主体。 如果等式计算为<tt> True </ tt>，则连接主体。"
		}),
		renderer: equationRenderer
	});
	return bottomDesc;
}

function buildConverterProps(cell, properties, descBase) {
	var bottomDesc = descBase + "转换器存储输入和输出数据表。 当输入源采用其中一个输入值时，转换器将采用相应的输出值。 如果当前输入源值不存在特定输入值，则对最近的输入邻居进行平均。";
	var n = neighborhood(cell);
	var dat = [
		["Time", "Time"]
	];
	for (var i = 0; i < n.length; i++) {
		if (!n[i].linkHidden) {
			dat.push([n[i].item.id, clean(n[i].item.getAttribute("name"))]);
		}
	}
	var converterStore = new Ext.data.ArrayStore({
		fields: ['myId', 'displayText'],
		data: dat
	});

	properties.push({
		'name': 'Source',
		'text': getText('输入源'),
		'value': cell.getAttribute("Source"),
		'group': ' ' + getText('配置'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			queryMode: 'local',
			store: converterStore,
			selectOnFocus: false,
			valueField: 'myId',
			editable: false,
			displayField: 'displayText'
		}),
		'renderer': graphPrimitiveRenderer
	});
	properties.push({
		'name': 'Data',
		'text': getText('数据'),
		'value': cell.getAttribute("Data"),
		'group': getText('输入/输出表'),
		'editor': new ConverterEditor({})
	});
	properties.push({
		'name': 'Interpolation',
		'text': getText('插值'),
		'value': cell.getAttribute("Interpolation"),
		'group': ' ' + getText('配置'),
		'editor': new Ext.form.ComboBox({
			triggerAction: "all",
			store: [
				['None', getText("无")],
				['Linear', getText("线性")]
			],
			editable: false,
			selectOnFocus: false
		})
	});
	return bottomDesc;
}

function buildTextProps(cell, properties, descBase) {
	var bottomDesc = descBase + "文本框用于注释模型。勾选“使用数学公式”后，标签内容将被MathJax渲染，支持LaTeX数学公式语法。";
	properties.push({
		'name': 'UseMathJax',
		'text': '使用数学公式',
		'value': isTrue(cell.getAttribute("UseMathJax")),
		'group': '  ' + getText('配置')
	});
	return bottomDesc;
}

// ── Main dispatcher ────────────────────────────────────────────────────────

function selectionChanged(forceClear) {

	if (isDefined(grid)) {
		grid.plugins[0].completeEdit();
		configPanel.removeAll()
	}


	var cell = graph.getSelectionCell();
	if (forceClear) {
		cell = null;
	}

	var bottomItems = [];
	var topItems = [];
	var properties = [];
	var cellType;
	if (cell != null) {
		cellType = cell.value.nodeName;
	}

	if (cell != null && graph.getSelectionCells().length == 1 && (cellType != "Ghost")) {
		configPanel.setTitle(getText(cellType));


		properties = [{
			'name': 'Note',
			'text': getText('注释'),
			'value': cell.getAttribute("Note"),
			'group': '  ' + getText('一般'),
			'editor': new RichTextEditor({})
		}, {
			'name': 'name',
			'text': getText('(名称)'),
			'value': cell.getAttribute("name"),
			'group': '  ' + getText('一般')
		}];

		if ((isValued(cell) || cell.value.nodeName == "Agents") && cell.value.nodeName != "State" && cell.value.nodeName != "Action") {
			if (viewConfig.allowEdits && cell.value.nodeName != "Converter") {
				properties.push({
					'name': 'ShowSlider',
					'text': getText('显示值滑块'),
					'value': isTrue(cell.getAttribute("ShowSlider")),
					'group': getText('滑块')
				});

				properties.push({
					'name': 'SliderMax',
					'text': getText('滑块最大值'),
					'value': parseFloat(cell.getAttribute("SliderMax")),
					'group': getText('滑块'),
					'editor': {
						xtype: 'numberfield',
						allowDecimals: true,
						decimalPrecision: 9
					}
				});


				properties.push({
					'name': 'SliderMin',
					'text': getText('滑块最小值'),
					'value': parseFloat(cell.getAttribute("SliderMin")),
					'group': getText('滑块'),
					'editor': {
						xtype: 'numberfield',
						allowDecimals: true,
						decimalPrecision: 9
					}
				});

				properties.push({
					'name': 'SliderStep',
					'text': getText('滑块步长'),
					'value': cell.getAttribute("SliderStep"),
					'group': getText('滑块'),
					'editor': {
						xtype: 'numberfield',
						minValue: 0,
						allowDecimals: true,
						decimalPrecision: 9
					}
				});
			}

			if (cell.value.nodeName != "Transition" && cell.value.nodeName != "Agents") {
				properties.push({
					'name': 'Units',
					'text': getText('单位'),
					'value': cell.getAttribute("Units"),
					'group': getText('验证'),
					'editor': new UnitsEditor({})
				});
			}

			if (viewConfig.allowEdits && cell.value.nodeName != "Agents") {
				properties.push({
					'name': 'MaxConstraintUsed',
					'text': getText('最大约束'),
					'value': isTrue(cell.getAttribute("MaxConstraintUsed")),
					'group': getText('验证')
				});

				properties.push({
					'name': 'MaxConstraint',
					'text': getText('最大约束'),
					'value': parseFloat(cell.getAttribute("MaxConstraint")),
					'group': getText('验证'),
					'editor': {
						xtype: 'numberfield',
						allowDecimals: true,
						decimalPrecision: 9
					}
				});


				properties.push({
					'name': 'MinConstraintUsed',
					'text': getText('最小约束'),
					'value': isTrue(cell.getAttribute("MinConstraintUsed")),
					'group': getText('验证')
				});

				properties.push({
					'name': 'MinConstraint',
					'text': getText('最小约束'),
					'value': parseFloat(cell.getAttribute("MinConstraint")),
					'group': getText('验证'),
					'editor': {
						xtype: 'numberfield',
						allowDecimals: true,
						decimalPrecision: 9
					}
				});
			}
		}

	} else {
		configPanel.setTitle("");
	}

	var descBase = "<br/><div class = 'fa fa-question-circle' style='float:left; margin-right: 7px; font-size: xx-large; display: block; color: grey'></div>";

	var topDesc = "",
		bottomDesc = "";
	if (cell == null || graph.getSelectionCells().length > 1) {
		var slids = sliderPrimitives();

		//no primitive has been selected. Stick in empty text and sliders.
		if (slids.length == 0) {
			if (is_ebook) {
				topDesc = "<center><big>Select a primitive to see its properties.</big></center>";
			} else {
				topDesc = "<center><br><br><img src='" + builder_path + "/images/nju.png' width=130 /><br><br><big><strong>环境虚拟仿真实验平台</strong></big><br/><br/><br/><div style = padding:10px>环境虚拟仿真平台是支撑物质循环及其环境效应教学科研的基础平台，立足于强大的互联网技术，旨在将环境要素模拟、物质循环过程模拟、环境风险预警与健康评估、环境经济政策模拟、生命周期管理等学科内容进行融合与集成，从环境安全、健康风险和资源可持续供给等多视角、多尺度剖析环境问题，为环境及相关专业学生培养提供实验条件，为环境保护事业的科学化与大众化提供基础支撑。<br><br>该平台是在<a href='https://insightmaker.com/'>Insight Maker</a>平台源代码基础上经过进一步开发形成的，后续仍将围绕物质循环及其环境效应相关环境虚拟仿真实验内容进行持续开发和更新，欢迎大家使用和交流。</div></center>";
			}
		} else {

			var topDesc = clean(graph_description);

			if (topDesc != "") {
				topDesc = "<div class='sidebar_description'>" + topDesc + "</div>";
			}
			if (graph_tags.trim() != "") {
				var topTags = graph_tags.split(",").map(function(tag) {
				var t = tag.trim();
				return "<a target='_blank' href='/tag/" + clean(t.replace(/ /g, "-")) + "'>" + clean(t) + "</a>";
				}).join(", ");
				topDesc = topDesc + "<div class='sidebar_tags'>Tags: " + topTags + "</div>";
			}

			if (slids.length > 0) {
				bottomItems.push(createSliders(false, function(cell, value){
					setValue(cell, value);
					if(linkedResults){
						runModel({
							onPause: function(res){
								res.resume();
							},
							onSuccess: function(res){
								//console.log("--");
								//console.log(res);
							},
							resultsWindow: linkedResults
						});
					}
				}, function(slider, setValue, textField, newValue) {
					Ext.Msg.confirm(getText("更改值"), getText("<p>图元的当前值为：</p><br/><p><pre>") + getValue(slider.sliderCell).replace(/\\n/g, "\n") + getText("</pre></p><br/><p>您确定要使用滑块更改此值吗？</p>"), function(btn) {
						if (btn == 'yes') {
							setValue(slider.sliderCell, parseFloat(newValue));
						} else {
							textField.setRawValue("");
							slider.setValue(undefined);
						}
						slider.confirming = false;

					});
				}));
			}
			bottomItems.push({
				xtype: "component",
				height: 0,
				margin: '100 0 0 0'
			});

		}

	} else if (cellType == "Stock") {
		bottomDesc = buildStockProps(cell, properties, descBase);

	} else if (cellType == "Variable") {
		bottomDesc = buildVariableProps(cell, properties, descBase);

	} else if (cell.value.nodeName == "Link") {
		bottomDesc = buildLinkProps(cell, properties, descBase);

	} else if (cell.value.nodeName == "Folder") {
		bottomDesc = buildFolderProps(cell, properties, descBase);

	} else if (cell.value.nodeName == "Button") {
		bottomDesc = buildButtonProps(cell, properties, descBase);

	} else if (cell.value.nodeName == "Flow") {
		bottomDesc = buildFlowProps(cell, properties, descBase);

	} else if (cell.value.nodeName == "Transition") {
		bottomDesc = buildTransitionProps(cell, properties, descBase);

	} else if (cell.value.nodeName == "Action") {
		bottomDesc = buildActionProps(cell, properties, descBase);

	} else if (cell.value.nodeName == "State") {
		bottomDesc = buildStateProps(cell, properties, descBase);

	} else if (cell.value.nodeName == "Agents") {
		bottomDesc = buildAgentsProps(cell, properties, descBase);

	} else if (cellType == "Ghost") {
			bottomDesc = descBase + "这个项目是另一个原始的'Ghost'。 它反映了源图元的值和属性。 您无法编辑Ghost的属性。 您需要编辑其源的属性。";
		bottomDesc = bottomDesc + "<center style='padding-top: 6px'><a href='#' onclick='var x = findID(getSelected()[0].getAttribute(\"Source\"));highlight(x);'>Show Source <i class='fa fa-angle-right '></i></a></center>";

	} else if (cellType == "Converter") {
		bottomDesc = buildConverterProps(cell, properties, descBase);

	} else if (cellType == "Picture") {
		bottomDesc = descBase + "图片可以让你的模型图变得活跃起来。 使用主工具栏的'样式'菜单中的图片设置更改图片。";

	} else if (cellType == "Text") {
		bottomDesc = buildTextProps(cell, properties, descBase);
	}
	configPanel.removeAll();



	if (topDesc != "") {
		topItems.push(Ext.create('Ext.Component', {
			html: '<div class="sidebar_top">' + topDesc + '</div>'
		}));
	}
	if (bottomDesc != "") {
		bottomItems.push(Ext.create('Ext.Component', {
			html: '<div class="sidebar_bottom">' + bottomDesc + '</div>'
		}))
	}


	createGrid(properties, topItems, bottomItems, cell);

	
}
