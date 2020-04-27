// Copyright Titanium I.T. LLC.
"use strict";

const parseArgs = require("minimist");
const pathLib = require("path");
const fs = require("fs");
const promisify = require("util").promisify;
const statAsync = promisify(fs.stat);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

module.exports = class Build {

	constructor({ incrementalDir }) {
		this._taskFns = {};
		this._incrementalDir = incrementalDir;
	}

	async runAsync(args, successMessage) {
		const argv = parseArgs(args);
		if (argv.help || argv.h || argv.T) return showHelp(this._taskFns);
		const tasksToRun = argv._.length === 0 ? ["default"] : argv._;

		const buildStart = Date.now();
		await this.runTasksAsync(tasksToRun);
		const elapsedSeconds = (Date.now() - buildStart) / 1000;
		console.log(`\n${successMessage}\n(${elapsedSeconds.toFixed(2)}s)`);
		return elapsedSeconds;
	}

	async runTasksAsync(tasksToRun) {
		let currentTask;
		try {
			for (const task of tasksToRun) {
				currentTask = task;
				const unknownTasks = tasksToRun.filter((task) => this._taskFns[task] === undefined);
				if (unknownTasks.length > 0) {
					showHelp();
					throw new Error(`Unrecognized task(s): ${unknownTasks.join(", ")}`);
				}
				await this._taskFns[task]();
			}
		}
		catch (err) {
			if (err.failedTask === undefined) err.failedTask = currentTask;
			throw err;
		}
	}

	task(name, fn) {
		this._taskFns[name] = fn;
	}

	incrementalTask(taskName, sourceFiles, fn) {
		this.task(taskName, async () => {
			const taskFile = `${this._incrementalDir}${taskName}.task`;
			if (!(await this.isAnyModifiedAsync(sourceFiles, taskFile))) return;

			await fn();
			this.writeDirAndFileAsync(taskFile, "ok");
		});
	}

	async isAnyModifiedAsync(sources, target) {
		const modifiedPromises = sources.map((source) => this.isModifiedAsync(source, target));
		const modifiedResults = await Promise.all(modifiedPromises);
		return modifiedResults.some((success) => success === true);
	}

	async isModifiedAsync(source, target) {
		try {
			const [sourceStats, targetStats] = await Promise.all([statAsync(source), statAsync(target)]);
			return sourceStats.mtime > targetStats.mtime;
		}
		catch(err) {
			if (err.code === "ENOENT") return true;
			else throw err;
		}
	}

	async writeDirAndFileAsync(file, contents) {
		const dir = pathLib.dirname(file);
		await mkdirAsync(dir, { recursive: true });
		await writeFileAsync(file, contents);
	}

};

function showHelp(taskFns) {
	const name = pathLib.basename(process.argv[1]).split(".")[0];
	console.log(`usage: ${name} [-h|--help|-T|--tasks] [--perf] <tasks>`);
	console.log("--help  This message");
	console.log();
	console.log("Available tasks:");
	Object.keys(taskFns).forEach((task) => console.log(`  ${task}`));
}
