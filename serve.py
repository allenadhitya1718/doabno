"""Local server for the DOABNO prototype.

Works like `python -m http.server`, but tells browsers to check for a newer copy of
each file on every load, so edits show up after a normal refresh (phones included).
"""
import argparse
import functools
import os
import http.server
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parent / 'web'


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description='Serve the DOABNO prototype from web/.')
    parser.add_argument('port', nargs='?', type=int, default=int(os.environ.get('PORT', 5173)))
    parser.add_argument('--bind', default='0.0.0.0',
                        help='address to listen on; 0.0.0.0 also lets phones on the same network connect')
    parser.add_argument('--root', default=None, help='folder to serve instead of web/ (for example web-v2)')
    args = parser.parse_args()
    root = (WEB_ROOT.parent / args.root) if args.root else WEB_ROOT
    handler = functools.partial(NoCacheHandler, directory=str(root))
    with http.server.ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f'Serving {root} at http://localhost:{args.port}  (Ctrl+C to stop)', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
