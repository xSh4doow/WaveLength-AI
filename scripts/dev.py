#!/usr/bin/env python3
"""
WaveLength Development Script
Starts backend and frontend together for development
"""

import subprocess
import sys
import signal
import argparse
from pathlib import Path


def kill_processes(backend_process, frontend_process):
    """Kill both processes gracefully"""
    print("\n🛑 Stopping services...")
    if backend_process:
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()

    if frontend_process:
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            frontend_process.kill()

    print("✅ Services stopped")
    sys.exit(0)


def main():
    parser = argparse.ArgumentParser(description="Start WaveLength development environment")
    parser.add_argument("--backend", action="store_true", help="Start only backend")
    parser.add_argument("--frontend", action="store_true", help="Start only frontend")
    parser.add_argument("--mock", action="store_true", help="Start backend in mock mode")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent
    backend_dir = project_root / "Back-End"
    frontend_dir = project_root / "Front-End"

    backend_process = None
    frontend_process = None

    # Setup signal handler for Ctrl+C
    def signal_handler(sig, frame):
        kill_processes(backend_process, frontend_process)

    signal.signal(signal.SIGINT, signal_handler)

    print("=" * 60)
    print("   🎵 WaveLength Development Environment")
    print("=" * 60)
    print()

    # Start backend
    if not args.frontend:
        print("🚀 Starting Backend...")
        backend_cmd = [sys.executable, "-m", "uvicorn", "src.main:app", "--reload", "--port", "8000"]
        backend_process = subprocess.Popen(
            backend_cmd,
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        print(f"✅ Backend running on http://localhost:8000")
        print()

    # Start frontend
    if not args.backend:
        print("🚀 Starting Frontend...")
        frontend_cmd = ["npm", "run", "dev"]
        frontend_process = subprocess.Popen(
            frontend_cmd,
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1,
            shell=True
        )
        print(f"✅ Frontend running on http://localhost:8080")
        print()

    print("=" * 60)
    print("   Press Ctrl+C to stop all services")
    print("=" * 60)
    print()

    # Stream output
    try:
        while True:
            if backend_process and backend_process.poll() is None:
                line = backend_process.stdout.readline()
                if line:
                    print(f"[BACKEND] {line.strip()}")

            if frontend_process and frontend_process.poll() is None:
                line = frontend_process.stdout.readline()
                if line:
                    print(f"[FRONTEND] {line.strip()}")

            # Check if processes have died
            if backend_process and backend_process.poll() is not None:
                print("❌ Backend process died")
                break
            if frontend_process and frontend_process.poll() is not None:
                print("❌ Frontend process died")
                break

    except KeyboardInterrupt:
        pass
    finally:
        kill_processes(backend_process, frontend_process)


if __name__ == "__main__":
    main()
