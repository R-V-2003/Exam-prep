import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
import sys

class LogHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        print("LOG:", urllib.parse.unquote(self.path))
        sys.stdout.flush()
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'ok')

print("Starting log server on 8000...")
sys.stdout.flush()
HTTPServer(('', 8000), LogHandler).serve_forever()
