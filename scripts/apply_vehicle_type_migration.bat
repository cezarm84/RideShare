@echo off
REM Script to apply database migrations and set up vehicle types

REM Navigate to project root
cd %~dp0\..

echo Applying database migrations...
call venv\Scripts\activate.bat
alembic upgrade head

echo Creating standard vehicle types...
python scripts\create_vehicle_types.py

echo Migration completed successfully!
pause