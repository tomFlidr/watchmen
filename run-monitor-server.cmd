@echo off
call %cd%/config/env-vars.cmd
set current_dir=%cd%
:: Node <= 10
::node --inspect-brk=127.0.0.1:9230 %current_dir%/run-monitor-server.js -e production
node %current_dir%/run-monitor-server.js -e production
