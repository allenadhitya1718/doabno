"""Run the whole redesign on one port.

  py serve-v2.py            ->  http://localhost:5174

  /           redesigned website   (web-v2/)
  /app/       redesigned mobile app (app-v2/)
  /admin/     admin portal with store and brand logos (admin-v2/)
  /old/       original website, /old/admin/ admin portal, /old/app/ original app (web/)

Like serve.py, it tells browsers to re-check files on every load, so edits show after a normal refresh.
"""
import argparse
import functools
import http.server
import os
import urllib.parse
from pathlib import Path

from serve import NoCacheHandler

ROOT = Path(__file__).resolve().parent
MOUNTS = (('/app/', 'app-v2'), ('/admin/', 'admin-v2'), ('/old/', 'web'))


class Handler(NoCacheHandler):
    def translate_path(self, path):
        p = urllib.parse.unquote(urllib.parse.urlsplit(path).path)
        for prefix, folder in MOUNTS:
            if p == prefix[:-1] or p.startswith(prefix):
                self.directory = str(ROOT / folder)
                return super().translate_path(p[len(prefix) - 1:] or '/')
        self.directory = str(ROOT / 'web-v2')
        return super().translate_path(p)


def main():
    parser = argparse.ArgumentParser(description='Serve the DOABNO redesign (website + app) on one port.')
    parser.add_argument('port', nargs='?', type=int, default=int(os.environ.get('PORT', 5174)))
    parser.add_argument('--bind', default='0.0.0.0', help='address to listen on; 0.0.0.0 also lets phones on the same network connect')
    args = parser.parse_args()
    with http.server.ThreadingHTTPServer((args.bind, args.port), functools.partial(Handler, directory=str(ROOT / 'web-v2'))) as server:
        print('DOABNO redesign running:', flush=True)
        print(f'  website   http://localhost:{args.port}/', flush=True)
        print(f'  app       http://localhost:{args.port}/app/', flush=True)
        print(f'  admin     http://localhost:{args.port}/admin/', flush=True)
        print(f'  original  http://localhost:{args.port}/old/  (admin: /old/admin/)', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
