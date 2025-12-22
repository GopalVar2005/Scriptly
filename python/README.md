Windows setup and troubleshooting

This project includes a local Python virtual environment at `env/`.
If the Node server reports errors like `No module named 'faster_whisper'`, the Node process is using a different Python interpreter than the one with the packages installed.

Recommended steps (PowerShell):

1) Install packages into the local venv using the venv's python executable:

```powershell
# From project root
.envPath = Join-Path $PWD "env\Scripts\python.exe"
# Install required packages
& .\env\Scripts\python.exe -m pip install --upgrade pip
& .\env\Scripts\python.exe -m pip install -r .\python\requirements.txt
```

2) (Optional) Activate the venv for interactive use:

```powershell
# Activate (may require changing execution policy)
. .\env\Scripts\Activate.ps1
# then you can run
python -m pip install -r .\python\requirements.txt
```

3) Verify the Node server uses the venv python (server logs now print which python is used):
- Start your Node server (e.g., `node app.js` or `npm start`) and check the console; you should see a message like:

```
Using python executable: C:\...\complete_model\JovacFinal1.0\env\Scripts\python.exe
```

If it still shows a system python, ensure the `env` folder exists and that `env\Scripts\python.exe` is present.

Notes:
- The `python/requirements.txt` already includes `faster-whisper` and other needed packages.
- If you see permission issues on `Activate.ps1`, you can run this once in an elevated PowerShell to allow script execution:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

If you want, I can also add an npm script to run the server using the venv python or try to detect additional venv layouts.
