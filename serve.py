#!/usr/bin/env python3
"""Servidor estático da Loja Fácil. Sem build. /admin abre a área da pesquisa."""

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "41731"))
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path.rstrip("/") == "/admin":
            self.path = "/admin.html" + (("?" + self.path.split("?", 1)[1]) if "?" in self.path else "")
        elif path == "/favicon.ico":
            self.path = "/favicon.svg"
        return super().do_GET()


def main():
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("Loja Fácil em http://127.0.0.1:%s/" % PORT, flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
