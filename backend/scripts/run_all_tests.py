"""
Bimba AI - Production-Ready Master Test Runner Suite
===================================================
Run: python scripts/run_all_tests.py
Executes Cloudinary, Resume Health, Improvement, Builder, and Job Matching tests.
"""

import os
import sys
import unittest
import asyncio

# Ensure project root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Import test classes
from scripts.test_resume_health import TestResumeHealthEndpoint
from scripts.test_resume_improvement import TestResumeImprovementEndpoint
from scripts.test_resume_builder import TestResumeBuilder
from scripts.test_job_recommendation import TestJobRecommendations

def run_production_tests():
    print("=" * 60)
    print("           BIMBA AI SYSTEM VERIFICATION SUITE")
    print("=" * 60)
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(TestResumeHealthEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestResumeImprovementEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestResumeBuilder))
    suite.addTests(loader.loadTestsFromTestCase(TestJobRecommendations))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 60)
    print("              SYSTEM VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"Total Tests Run : {result.testsRun}")
    print(f"Errors          : {len(result.errors)}")
    print(f"Failures        : {len(result.failures)}")
    print("-" * 60)
    
    if result.wasSuccessful():
        print("STATUS: ALL TESTS PASSED (OK) - BIMBA AI IS STABLE")
        print("=" * 60)
        sys.exit(0)
    else:
        print("STATUS: VERIFICATION ENCOUNTERED FAILURES / ERRORS")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    run_production_tests()
