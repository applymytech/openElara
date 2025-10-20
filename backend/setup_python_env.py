import subprocess
import sys
import os

def install_requirements():
    print("Setting up Python environment for openElara...")
    print(f"Using Python executable: {sys.executable}")
    
    requirements_path = os.path.join(os.path.dirname(__file__), 'requirements.txt')
    
    if not os.path.exists(requirements_path):
        print("ERROR: requirements.txt not found!")
        return False
    
    print(f"Installing Python dependencies from: {requirements_path}")
    
    try:
        # Upgrade pip first
        print("Upgrading pip...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], 
                      capture_output=True, text=True, check=True)
        
        # Install dependencies
        print("Installing Python dependencies...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', requirements_path], 
                              capture_output=True, text=True, check=True)
        print("[SUCCESS] Python dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print("[ERROR] Failed to install dependencies!")
        print("--- STDOUT ---")
        print(e.stdout)
        print("--- STDERR ---")
        print(e.stderr)
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error during installation: {e}")
        return False

if __name__ == '__main__':
    print("openElara Python Environment Setup")
    print("==================================")
    print("This script will install the required Python packages for openElara.")
    print("")
    
    if install_requirements():
        print("")
        print("[SUCCESS] Backend Python environment ready!")
        print("")
        print("You can now use all openElara features that require Python.")
        print("")
        sys.exit(0)
    else:
        print("")
        print("[FAILURE] Setup failed - check the errors above")
        print("")
        print("Troubleshooting tips:")
        print("- Make sure Python 3.10+ is installed and in your PATH")
        print("- Try running this script manually: python setup_python_env.py")
        print("- Check that you have internet access to download packages")
        print("")
        sys.exit(1)