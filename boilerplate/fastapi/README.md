# FastAPI Boilerplate

API REST minimalista e moderna com FastAPI.

## Quick Start
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## Endpoints
- `GET /health` - Health check
- `GET /docs` - Swagger UI automático
- `POST /items` - Cria item

## Estrutura
```
fastapi/
├── main.py
├── models.py
├── database.py
└── routers/
    └── items.py
```