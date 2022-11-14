#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

. $SCRIPT_DIR/config/env-vars.sh

/usr/bin/redis-server $SCRIPT_DIR/redis.conf --supervised systemd
