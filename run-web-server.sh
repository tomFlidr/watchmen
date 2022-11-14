#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

. $SCRIPT_DIR/config/env-vars.sh

/usr/bin/node10 $SCRIPT_DIR/run-web-server.js -p 3456 -e production
