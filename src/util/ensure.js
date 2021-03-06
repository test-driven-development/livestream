// Copyright Titanium I.T. LLC. See LICENSE.txt for details.
"use strict";

const type = require("./type.js");

exports.that = function(variable, message) {
	if (message === undefined) message = "Expected condition to be true";

	if (variable === false) throw new Error(message);
	if (variable !== true) throw new Error("Expected condition to be true or false");
};

exports.unreachable = function(message) {
	if (!message) message = "Unreachable code executed";

	throw new Error(message);
};

exports.todo = function() {
	exports.unreachable("To-do code executed");
};

exports.defined = function(variable, variableName) {
	if (variable === undefined) throw new Error(`${normalize(variableName)} was not defined`);
};

exports.signature = function(args, signature, names) {
	checkSignature(false, args, signature, names);
};

exports.signatureMinimum = function(args, signature, names) {
	checkSignature(true, args, signature, names);
};

exports.type = function(variable, expectedType, name) {
	checkType(variable, expectedType, false, name);
};

exports.typeMinimum = function(variable, expectedType, name) {
	checkType(variable, expectedType, true, name);
};

function checkSignature(allowExtra, args, signature = [], names = []) {
	exports.that(Array.isArray(signature), "ensure.signature(): signature parameter must be an array");
	exports.that(Array.isArray(names), "ensure.signature(): names parameter must be an array");

	const expectedArgCount = signature.length;
	const actualArgCount = args.length;

	if (!allowExtra && (actualArgCount > expectedArgCount)) {
		throw new Error(`Function called with too many arguments: expected ${expectedArgCount} but got ${actualArgCount}`);
	}

	signature.forEach(function(expectedType, i) {
		const name = names[i] ? names[i] : `Argument #${(i + 1)}`;
		checkType(args[i], expectedType, allowExtra, name);
	});
}

function checkType(variable, expectedType, allowExtraKeys, name) {
	const error = type.check(variable, expectedType, { name: normalize(name), allowExtraKeys });
	if (error !== null) throw new Error(error);
}

function checkTypeFn(type) {
	return function(variable, variableName) {
		exports.type(variable, type, variableName);
	};
}

function normalize(variableName) {
	return variableName ? variableName : "variable";
}
