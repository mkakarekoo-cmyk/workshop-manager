@echo off
for /f "tokens=2 delims==" %%a in ('findstr "GITHUB_TOKEN" .env') do set TOKEN=%%a
git remote set-url origin https://%TOKEN%@github.com/mkakarekoo-cmyk/workshop-manager.git
echo Remote URL zaktualizowany z tokenem.
git fetch
echo Gotowe!
pause
