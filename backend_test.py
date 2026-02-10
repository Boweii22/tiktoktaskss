import requests
import sys
import json
from datetime import datetime

class ImpossibleTasksAPITester:
    def __init__(self, base_url="https://trickytap.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = f"test_session_{datetime.now().strftime('%H%M%S')}"

    def run_test(self, name, method, endpoint, expected_status, data=None, validate_response=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    if validate_response:
                        validation_result = validate_response(response_data)
                        if validation_result is True:
                            self.tests_passed += 1
                            print(f"✅ Passed - Status: {response.status_code}")
                            return True, response_data
                        else:
                            print(f"❌ Failed - Validation error: {validation_result}")
                            return False, {}
                    else:
                        self.tests_passed += 1
                        print(f"✅ Passed - Status: {response.status_code}")
                        return True, response_data
                except json.JSONDecodeError:
                    print(f"❌ Failed - Invalid JSON response")
                    return False, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def validate_tasks_response(self, data):
        """Validate the tasks response structure"""
        if not isinstance(data, list):
            return "Response should be a list"
        
        if len(data) != 12:
            return f"Expected 12 tasks, got {len(data)}"
        
        required_fields = ['id', 'name', 'instruction', 'type', 'config', 'stats']
        stats_fields = ['task_id', 'attempts', 'completions', 'completion_rate']
        
        for i, task in enumerate(data):
            for field in required_fields:
                if field not in task:
                    return f"Task {i} missing field: {field}"
            
            # Validate stats structure
            stats = task.get('stats', {})
            for field in stats_fields:
                if field not in stats:
                    return f"Task {i} stats missing field: {field}"
        
        return True

    def validate_single_task_response(self, data):
        """Validate single task response"""
        required_fields = ['id', 'name', 'instruction', 'type', 'config', 'stats']
        for field in required_fields:
            if field not in data:
                return f"Missing field: {field}"
        return True

    def validate_stats_response(self, data):
        """Validate stats response"""
        required_fields = ['task_id', 'attempts', 'completions', 'completion_rate']
        for field in required_fields:
            if field not in data:
                return f"Missing field: {field}"
        return True

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200,
            validate_response=lambda data: True if 'message' in data else "Missing message field"
        )

    def test_get_all_tasks(self):
        """Test GET /api/tasks - should return all 12 tasks with stats"""
        return self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200,
            validate_response=self.validate_tasks_response
        )

    def test_get_single_task(self, task_id):
        """Test GET /api/tasks/{task_id}"""
        return self.run_test(
            f"Get Single Task ({task_id})",
            "GET",
            f"tasks/{task_id}",
            200,
            validate_response=self.validate_single_task_response
        )

    def test_record_attempt(self, task_id):
        """Test POST /api/tasks/{task_id}/attempt"""
        return self.run_test(
            f"Record Attempt ({task_id})",
            "POST",
            f"tasks/{task_id}/attempt",
            200,
            data={"session_id": self.session_id},
            validate_response=lambda data: True if data.get('status') == 'recorded' else "Invalid status"
        )

    def test_record_completion(self, task_id):
        """Test POST /api/tasks/{task_id}/complete"""
        return self.run_test(
            f"Record Completion ({task_id})",
            "POST",
            f"tasks/{task_id}/complete",
            200,
            data={"session_id": self.session_id, "time_taken": 3000},
            validate_response=lambda data: True if data.get('status') == 'completed' else "Invalid status"
        )

    def test_get_task_stats(self, task_id):
        """Test GET /api/tasks/{task_id}/stats"""
        return self.run_test(
            f"Get Task Stats ({task_id})",
            "GET",
            f"tasks/{task_id}/stats",
            200,
            validate_response=self.validate_stats_response
        )

    def test_get_leaderboard(self):
        """Test GET /api/leaderboard"""
        return self.run_test(
            "Get Leaderboard",
            "GET",
            "leaderboard",
            200,
            validate_response=lambda data: True if isinstance(data, list) else "Should return a list"
        )

    def test_invalid_task_id(self):
        """Test with invalid task ID"""
        return self.run_test(
            "Invalid Task ID",
            "GET",
            "tasks/invalid_task_id",
            404
        )

def main():
    print("🚀 Starting Impossible Tasks API Tests")
    print("=" * 50)
    
    tester = ImpossibleTasksAPITester()
    
    # Test basic endpoints
    tester.test_root_endpoint()
    
    # Test get all tasks (this gives us task IDs to use)
    success, tasks_data = tester.test_get_all_tasks()
    
    if not success or not tasks_data:
        print("❌ Cannot proceed without tasks data")
        return 1
    
    # Get first task ID for detailed testing
    first_task = tasks_data[0] if tasks_data else None
    if not first_task:
        print("❌ No tasks found in response")
        return 1
    
    task_id = first_task['id']
    print(f"\n📋 Using task '{task_id}' for detailed testing")
    
    # Test individual task operations
    tester.test_get_single_task(task_id)
    tester.test_get_task_stats(task_id)
    tester.test_record_attempt(task_id)
    tester.test_record_completion(task_id)
    
    # Test leaderboard
    tester.test_get_leaderboard()
    
    # Test error cases
    tester.test_invalid_task_id()
    
    # Test a few more task IDs to ensure they all work
    expected_task_ids = ['hold3000', 'static_tap', 'shrinking_circle']
    for test_task_id in expected_task_ids:
        if any(t['id'] == test_task_id for t in tasks_data):
            tester.test_get_single_task(test_task_id)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())