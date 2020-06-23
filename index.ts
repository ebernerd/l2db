/*
	Love2D Project Builder
	by Eric Bernard
*/

import yargs = require("yargs")
import archiver = require("archiver")
import fse = require("fs-extra")
import { execSync } from "child_process"
import { existsSync, mkdirSync, createWriteStream, rmdirSync } from "fs"
import { join as joinPath } from "path"

const argv = yargs.options({
	src: {
		type: "string",
		default: "./src",
		alias: "s",
		describe: "The directory with your source .lua files",
	},
	iconSrc: {
		alias: "i",
		type: "string",
		default: "./src/icon.ico",
		describe: "The path to the .ico icon file",
	},
	outDir: {
		alias: "o",
		type: "string",
		default: "./dist",
		describe: "The folder you'd like output files to go into",
	},
	loveDir: {
		alias: "ld",
		type: "string",
		default: `C:\\Program\ Files\\LOVE\\`,
		describe: "The path to where your Love2D install is",
	},
	gameName: {
		alias: "n",
		type: "string",
		demandOption: true,
		describe: "The name of your game",
	},
}).argv

// First, let's ensure that a main.lua file exists in the given user directory
const srcDir = argv.src
if (!existsSync(joinPath(srcDir, "/main.lua"))) {
	console.error(`Couldn't find main.lua file in ${srcDir}!`)
}

const finalizeDist = () => {
	console.log("Your build is complete!")
}

const createWindowsDist = (loveFile: string) => {
	console.log("Creating Windows distribution...")
	switch (process.platform) {
		default: {
			break
		}
		case "win32": {
			const winDistDir = argv.outDir + "/win"
			const winTempDir = `${winDistDir}/temp`
			// Create the temporary build folder
			if (existsSync(winTempDir)) {
				rmdirSync(winTempDir)
			}

			// Copy the Love2D files
			fse.copySync(argv.loveDir, joinPath(winDistDir, "/temp"))

			// Fuse the previously made .love to the love exe
			const fuseCommand: string = `copy /b "${winTempDir}/love.exe"+"${loveFile}" "${winTempDir}/${argv.gameName}.exe"`
			execSync(fuseCommand)

			// ZIP the temp folder
			let zipWriteStream = createWriteStream(
				winDistDir + `/${argv.gameName}-win.zip`
			)
			let zipArchiver = archiver("zip")
			zipArchiver.pipe(zipWriteStream)
			zipArchiver.directory(winTempDir, "").finalize()

			zipWriteStream.on("close", () => {
				// Remove the temp windows dir
				rmdirSync(winTempDir, { recursive: true })
				finalizeDist()
			})

			break
		}
	}
}

// Cleanup any existing build files
rmdirSync(argv.outDir, { recursive: true })
mkdirSync(argv.outDir)
mkdirSync(joinPath(argv.outDir, "/love"))
mkdirSync(joinPath(argv.outDir, "/win"))
mkdirSync(joinPath(argv.outDir, "/mac"))
mkdirSync(joinPath(argv.outDir, "/linux"))

// First, let's create the Love2D file
console.log("Creating .love distribution...")
let loveFilePath = `${argv.outDir}/love/${argv.gameName}.love`
let zipWriteStream = createWriteStream(loveFilePath)
let zipArchive = archiver("zip")
zipArchive.pipe(zipWriteStream)
zipArchive.directory(argv.src, "").finalize()

// Execute platform specific build processes once the zipWriteStream is ready
zipWriteStream.on("close", () => createWindowsDist(loveFilePath))
