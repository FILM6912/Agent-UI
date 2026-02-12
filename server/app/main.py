from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastmcp import FastMCP
from fastmcp.server.openapi import RouteMap, MCPType
import uvicorn

from app.core.config import get_settings
from app.api.v1.router import api_router

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
    lifespan=lifespan
)

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


mcp = FastMCP.from_fastapi(
    app=app,
    name="File Management MCP Server",
    route_maps=[
        RouteMap(
            methods=["GET"],
            pattern=r".*\{.*\}.*",
            mcp_type=MCPType.RESOURCE_TEMPLATE
        ),
        RouteMap(
            methods=["GET"],
            pattern=r".*",
            mcp_type=MCPType.RESOURCE
        ),
    ]
)

mcp_app = mcp.http_app(path="/mcp")

combined_app = FastAPI(
    title=f"{settings.TITLE} with MCP",
    version=settings.VERSION,
    description=f"{settings.DESCRIPTION} - Combined REST API and MCP server",
    routes=[
        *mcp_app.routes,
        *app.routes,
    ],
    lifespan=lifespan,
)


if __name__ == "__main__":
    uvicorn.run(
        combined_app,
        host=settings.HOST,
        port=settings.PORT,
        log_level="info"
    )
