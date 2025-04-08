@echo off
REM Script to merge multiple Alembic migration heads

REM Display current heads
echo Current migration heads:
alembic heads

REM Get the revision identifiers
echo.
echo Please enter the head revisions from above, separated by spaces:
set /p heads="> "

REM Create merge migration
echo.
echo Creating merge migration...
alembic merge -m "merge multiple heads" %heads%

REM Upgrade to the new merged head
echo.
echo Upgrading to the new merged head...
alembic upgrade heads

echo.
echo Migration merge complete!