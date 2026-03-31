#!/bin/bash
set -e
./node_modules/.bin/tspc -p ./tsconfig.test.json "$@"
