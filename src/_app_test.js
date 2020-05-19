// Copyright Titanium I.T. LLC.
"use strict";

const td = require("testdouble");
const CommandLine = require("./infrastructure/command_line");
const Rot13 = require("./logic/rot13");
const App = require("./app");

describe("App", function() {

	it("read command-line argument, transform it with ROT-13, and write result", function() {
		const { commandLine, app } = setup(["my input"]);
		const expectedOutput = Rot13.create().transform("my input");

		app.run();
		td.verify(commandLine.writeOutput(expectedOutput));
	});

	it("writes usage to command-line when no argument provided", function() {
		const { commandLine, app } = setup([]);
		app.run();
		td.verify(commandLine.writeOutput("Usage: run text_to_transform"));
	});

	it("complains when too many command-line arguments provided", function() {
		const { commandLine, app } = setup([ "a", "b" ]);
		app.run();
		td.verify(commandLine.writeOutput("too many arguments"));
	});

});


function setup(args) {
	const commandLine = td.object(CommandLine.create());
	const app = App.create(commandLine);

	td.when(commandLine.args()).thenReturn(args);

	return { commandLine, app };
}
