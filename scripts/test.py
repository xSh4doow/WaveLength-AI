#!/usr/bin/env python3
"""
WaveLength Test Runner
Runs all tests (backend + frontend) and reports coverage
"""

import subprocess
import sys
from pathlib import Path
import json


def run_command(cmd, cwd, description):
    """Run a command and return success status"""
    print(f"\n{'=' * 60}")
    print(f"  {description}")
    print(f"{'=' * 60}\n")

    result = subprocess.run(cmd, cwd=cwd, shell=True)
    return result.returncode == 0


def main():
    project_root = Path(__file__).parent.parent
    backend_dir = project_root / "Back-End"
    frontend_dir = project_root / "Front-End"

    print("=" * 60)
    print("   🧪 WaveLength Test Suite")
    print("=" * 60)

    # Run backend tests
    backend_success = run_command(
        "pytest --cov=src --cov-report=term-missing --cov-report=html --cov-fail-under=90",
        backend_dir,
        "Backend Tests (pytest)"
    )

    # Run frontend tests
    frontend_success = run_command(
        "npm run test:coverage",
        frontend_dir,
        "Frontend Tests (vitest)"
    )

    # Summary
    print("\n" + "=" * 60)
    print("   📊 Test Summary")
    print("=" * 60)

    print(f"\n{'Backend Tests:':<20} {'✅ PASSED' if backend_success else '❌ FAILED'}")
    print(f"{'Frontend Tests:':<20} {'✅ PASSED' if frontend_success else '❌ FAILED'}")

    # Coverage reports
    print(f"\n📁 Coverage Reports:")
    print(f"   Backend:  {backend_dir / 'htmlcov' / 'index.html'}")
    print(f"   Frontend: {frontend_dir / 'coverage' / 'index.html'}")

    # Exit code
    if backend_success and frontend_success:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
