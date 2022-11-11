@echo off
call %cd%/config/env-vars.cmd
set current_dir=%cd%
cd C:/works/tools/nvm/v10.21.0
node64 --inspect-brk=127.0.0.1:9229 %current_dir%/run-web-server.js -p 3456 -e production
::node64 %current_dir%/run-web-server.js -p 3456 -e production
cd %current_dir%
