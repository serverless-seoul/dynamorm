#!/bin/bash
set -e
./node_modules/.bin/eslint src "$@"
