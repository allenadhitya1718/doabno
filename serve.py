"""Local server for the DOABNO prototype.

Works like `python -m http.server`, but tells browsers to check for a newer copy of
each file on every load, so edits show up after a normal refresh (phones included).
"""
import argparse
import functools
import http.server
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parent / 'web'


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description='Serve the DOABNO prototype from web/.')
    parser.add_argument('port', nargs='?', type=int, default=5173)
    parser.add_argument('--bind', default='0.0.0.0',
                        help='address to listen on; 0.0.0.0 also lets phones on the same network connect')
    args = parser.parse_args()
    handler = functools.partial(NoCacheHandler, directory=str(WEB_ROOT))
    with http.server.ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f'Serving {WEB_ROOT} at http://localhost:{args.port}  (Ctrl+C to stop)', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
