from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    TITLE: str = "File Management API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "API for file management with MCP support"
    API_V1_STR: str = "/api/v1"
    UPLOAD_DIR: str = "uploads"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    ALLOWED_ORIGINS: List[str] = ["*"]
    ALLOWED_EXTENSIONS: List[str] = [
        'txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'csv',
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'xls', 'xlsx'
    ]
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
