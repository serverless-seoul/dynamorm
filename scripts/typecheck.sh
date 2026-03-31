#!/bin/bash
set -e
./node_modules/.bin/tsc --noEmit "$@"
