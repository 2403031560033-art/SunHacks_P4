"""
OrgMemory — Auto-installer for missing dependencies.
Run this script once before starting the backend:
    python install_deps.py
"""
import subprocess
import sys

PACKAGES = [
    'flask==3.0.0',
    'flask-cors==4.0.0',
    'chromadb==0.4.22',
    'PyPDF2==3.0.1',
    'PyJWT==2.8.0',
    'bcrypt==4.1.3',
    'posthog==3.3.1',
]

def install(package):
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])

if __name__ == '__main__':
    print("Installing OrgMemory backend dependencies...\n")
    for pkg in PACKAGES:
        try:
            install(pkg)
            print(f"  ✓ {pkg}")
        except subprocess.CalledProcessError as e:
            print(f"  ✗ Failed to install {pkg}: {e}")
    print("\nAll done! You can now start the backend with: python app.py")
