#!/bin/bash
set -e
./node_modules/.bin/tsc -p ./tsconfig.test.json --noEmit "$@"
