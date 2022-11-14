#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

. $SCRIPT_DIR/config/env-vars.sh

/usr/bin/node10 $SCRIPT_DIR/run-monitor-server.js -e production
