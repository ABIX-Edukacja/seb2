#!/bin/bash
cd ../../../../firefox/mac
./64/Firefox.app/Contents/MacOS/firefox -app ../../browser/app/seb.ini -profile ../../browser/bin/mac/sebProfile64 -logfile 1 -debug 1 -config "config.dev.json" -no-remote -purgecaches