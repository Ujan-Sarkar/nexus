import sys
import os
import json
import io
from http.server import HTTPServer, BaseHTTPRequestHandler

# --- THE ONLY ADDITION: Fix for the 'charmap' / UTF-8 Error ---
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
# --------------------------------------------------------------

# CRITICAL: Add the current directory to sys.path so it can find engine.py and bridge.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("DEBUG: main.py is starting...")
print(f"Python executable: {sys.executable}")

class MLHandler(BaseHTTPRequestHandler):
    # Fix 1: Add CORS headers so your Node.js server doesn't get blocked
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        if self.path == "/health":
            try:
                # Import inside the function to catch errors
                from engine import MediOptimaEngine
                eng = MediOptimaEngine()
                mode = "mock" if getattr(eng, 'mock_mode', False) else "production"
                self._set_headers(200)
                self.wfile.write(json.dumps({"status": "healthy", "mode": mode}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"status": "error", "error": str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)

    def do_POST(self):
        if self.path == "/analyze":
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                # Ensure decoding is UTF-8
                data = json.loads(post_data.decode('utf-8'))
                
                # Extract identifiers
                appointment_id = data.get("appointment_id")
                patient_id = data.get("patient_id")
                test_name = data.get("test_name")
                
                # Import engine and bridge
                from engine import MediOptimaEngine
                from bridge import EMRBridge
                
                eng = MediOptimaEngine()
                br = EMRBridge()
                
                if appointment_id:
                    # Logic for appointment-based features
                    features = br.get_patient_features(appointment_id)
                    result = eng.analyze(features)
                else:
                    # This calls the fixed method in your engine.py
                    result = eng.analyze_test(patient_id, test_name)
                
                self._set_headers(200)
                self.wfile.write(json.dumps(result).encode('utf-8'))
            except Exception as e:
                print(f"ERROR during /analyze: {e}")
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)

class MLServer(HTTPServer):
    allow_reuse_address = True

def run(port=8001):
    server_address = ('0.0.0.0', port) # Bind to all interfaces
    httpd = MLServer(server_address, MLHandler)
    print(f"Medi-Optima Engine LIVE on port {port}...", flush=True)
    httpd.serve_forever()

if __name__ == "__main__":
    run()