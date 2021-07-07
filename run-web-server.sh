#!/bin/bash

. ./config/env-vars.sh

/usr/bin/node10 run-web-server.js -p 3456 -e production
