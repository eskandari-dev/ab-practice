"""Production entry point: the API under /api and the built React site on every other path."""
import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from main import app as api

STATIC_DIR = os.getenv("STATIC_DIR") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


class SiteFiles(StaticFiles):
    # React Router pages like /practice have no file, so they get index.html
    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as error:
            if error.status_code != 404:
                raise
            return await super().get_response("index.html", scope)


app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", api)
app.mount("/", SiteFiles(directory=STATIC_DIR, html=True), name="site")
