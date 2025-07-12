@echo off

set port=8080
set /p port="Please enter the port (default is 8080): "
if "%port%"=="" set port=8080

netsh http add urlacl url=http://+:%port%/ user=%USERNAME%

pause
