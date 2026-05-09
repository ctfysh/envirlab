// .evl → ModelJSON → .evl round-trip test
// Run: node tests/test_roundtrip.mjs

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envirlabRoot = resolve(__dirname, "..");

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { loadInsightMaker, toModelJSON, loadModelJSON } = require(resolve(envirlabRoot, "js/ModelJSON.js"));
const { toInsightMakerXML } = require(resolve(envirlabRoot, "js/InsightMakerExporter.js"));

let passCount = 0, failCount = 0;

function test(name, fn) {
	try {
		fn();
		console.log(`  PASS: ${name}`);
		passCount++;
	} catch (e) {
		console.error(`  FAIL: ${name} — ${e.message}`);
		failCount++;
	}
}

function assert(cond, msg) {
	if (!cond) throw new Error(msg || "assertion failed");
}

// ===== Test 1: Minimal model (no primitives) =====
(function() {
	console.log("=== Test 1: Minimal model ===");
	const xml = `<InsightMakerModel><root><info id="0"><mxCell/></info><mxCell id="1" parent="0"/><Setting Note="" Version="39" TimeLength="10" TimeStart="0" TimeStep="0.25" TimeUnits="Years" Units="" SolutionAlgorithm="RK1" BackgroundColor="white" Throttle="-1" Macros="" StyleSheet="{}" id="2"><mxCell parent="1" vertex="1" visible="0"><mxGeometry x="20" y="20" width="80" height="40" as="geometry"/></mxCell></Setting></root></InsightMakerModel>`;

	test("loadInsightMaker", () => { loadInsightMaker(xml); });
	let m = loadInsightMaker(xml);
	test("simulate", () => { m.simulate(); });
	let json = toModelJSON(m);
	test("toModelJSON has elements", () => { assert(Array.isArray(json.elements)); });
	let m2 = loadModelJSON(json);
	test("ModelJSON re-import simulate", () => { m2.simulate(); });
	let xmlOut = toInsightMakerXML(m2);
	test("toInsightMakerXML output has InsightMakerModel", () => { assert(xmlOut.includes("InsightMakerModel")); });
	test("toInsightMakerXML output has root", () => { assert(xmlOut.includes("<root>")); });
	let m3 = loadInsightMaker(xmlOut);
	test("Round-tripped XML simulate", () => { m3.simulate(); });
})();

// ===== Test 2: Model with Stock, Variable, Flow, Link =====
(function() {
	console.log("=== Test 2: Model with primitives ===");
	const xml = `<InsightMakerModel><root><info id="0"><mxCell/></info><mxCell id="1" parent="0"/><Setting Note="" Version="39" TimeLength="10" TimeStart="0" TimeStep="0.25" TimeUnits="Years" Units="" SolutionAlgorithm="RK1" BackgroundColor="white" Throttle="-1" Macros="" StyleSheet="{}" id="2"><mxCell parent="1" vertex="1" visible="0"><mxGeometry x="20" y="20" width="80" height="40" as="geometry"/></mxCell></Setting><Stock name="Population" Note="" InitialValue="100" NonNegative="false" Units="" ShowSlider="false" id="3"><mxCell style="stock;fontSize=12;" parent="1" vertex="1"><mxGeometry x="110" y="110" width="80" height="40" as="geometry"/></mxCell></Stock><Variable name="Growth Rate" Note="" Equation="0.05" Units="" ShowSlider="false" id="4"><mxCell style="variable;fontSize=12;" parent="1" vertex="1"><mxGeometry x="110" y="220" width="80" height="40" as="geometry"/></mxCell></Variable><Flow name="Net Growth" Note="" FlowRate="[Population] * [Growth Rate]" OnlyPositive="false" id="5"><mxCell style="flow;" parent="1" edge="1" source="3" target="3"><mxGeometry as="geometry"><mxPoint x="150" y="150" as="sourcePoint"/><mxPoint x="150" y="170" as="targetPoint"/></mxGeometry></mxCell></Flow><Link name="" Note="" id="6"><mxCell style="link;" parent="1" edge="1" source="4" target="5"><mxGeometry as="geometry"><mxPoint x="150" y="240" as="sourcePoint"/><mxPoint x="130" y="175" as="targetPoint"/></mxGeometry></mxCell></Link></root></InsightMakerModel>`;

	test("loadInsightMaker", () => { loadInsightMaker(xml); });
	let m = loadInsightMaker(xml);
	test("simulate original", () => { m.simulate(); });

	let json = toModelJSON(m);
	test("ModelJSON has elements", () => { assert(json.elements.length >= 3, "expected 3+ elements"); });

	let m2 = loadModelJSON(json);
	test("simulate from ModelJSON", () => { m2.simulate(); });

	let xmlOut = toInsightMakerXML(m2);
	test("output has Population", () => { assert(xmlOut.includes('name="Population"')); });
	test("output has Growth Rate", () => { assert(xmlOut.includes('name="Growth Rate"')); });
	test("output has FlowRate", () => { assert(xmlOut.includes("FlowRate=")); });
	test("output has Equation", () => { assert(xmlOut.includes("Equation=")); });

	let m3 = loadInsightMaker(xmlOut);
	test("simulate round-tripped XML", () => { m3.simulate(); });
	test("round-tripped model has primitives", () => { assert(m3.find().length >= 3); });

	// Verify the results match
	let res1 = m.simulate();
	let res2 = m3.simulate();
	let pop1 = m.get(p => p.name === "Population");
	let pop2 = m3.get(p => p.name === "Population");
	if (pop1 && pop2) {
		let v1 = res1.value(pop1);
		let v2 = res2.value(pop2);
		test("results match (last value)", () => {
			let last1 = v1[v1.length - 1];
			let last2 = v2[v2.length - 1];
			assert(Math.abs(last1 - last2) < 0.001, `values differ: ${last1} vs ${last2}`);
		});
	}
})();

// ===== Test 3: Real .evl file =====
(function() {
	console.log("=== Test 3: Real .evl file ===");
	const evlPath = resolve(envirlabRoot, "examples/pflow_sim_story.evl");
	const evlContent = readFileSync(evlPath, "utf-8");

	test("load real .evl", () => { loadInsightMaker(evlContent); });
	let m = loadInsightMaker(evlContent);
	test("simulate real model", () => { m.simulate(); });

	let json = toModelJSON(m);
	test("ModelJSON has elements", () => { assert(json.elements.length > 0); });

	let m2 = loadModelJSON(json);
	test("simulate ModelJSON re-import", () => { m2.simulate(); });

	let xmlOut = toInsightMakerXML(m2);
	test("output is valid XML", () => {
		assert(xmlOut.includes("<InsightMakerModel>"));
		assert(xmlOut.includes("</InsightMakerModel>"));
	});
	test("output has mxCell entries", () => { assert(xmlOut.includes("<mxCell")); });
	test("output contains Setting", () => { assert(xmlOut.includes("Setting")); });

	let m3 = loadInsightMaker(xmlOut);
	test("simulate round-tripped real model", () => { m3.simulate(); });
})();

// ===== Summary =====
console.log(`\n=== Results: ${passCount} passed, ${failCount} failed ===`);
if (failCount > 0) process.exit(1);
