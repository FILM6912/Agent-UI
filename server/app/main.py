from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mcp import FastApiMCP
from fastmcp.server.openapi import RouteMap, MCPType
import uvicorn

from app.core.config import get_settings
from app.api.v1.router import api_router
from FDocs import f_docs

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.TITLE} server...")
    print(f"Upload directory: {settings.UPLOAD_DIR}")
    print(f"MCP endpoint: /mcp")
    yield
    print(f"Shutting down {settings.TITLE} server...")


app = FastAPI(
    title=settings.TITLE,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url=None,
)
app = f_docs(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", operation_id="root")
async def root():
    return {
        "name": settings.TITLE,
        "version": settings.VERSION,
        "status": "running",
        "api_v1": settings.API_V1_STR,
        "mcp_endpoint": "/mcp",
        "docs": "/docs",
        "redoc": "/redoc"
    }



combined_app = FastAPI(
    title=f"{settings.TITLE} with MCP",
    version=settings.VERSION,
    description=f"{settings.DESCRIPTION} - Combined REST API and MCP server",
    routes=[
        *app.routes,
    ],
    lifespan=lifespan,
)

combined_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mcp = FastApiMCP(combined_app)
mcp.mount()

if __name__ == "__main__":
    uvicorn.run(
        combined_app,
        host=settings.HOST,
        port=settings.PORT,
        log_level="info"
    )

