@echo off
set current_dir=%cd%
cd c:/Program Files/Redis
redis-server.exe %current_dir%/redis.dev.conf
