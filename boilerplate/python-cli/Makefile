.PHONY: install test lint format

install:
	pip install -e ".[dev]"

test:
	pytest tests/ -v

lint:
	ruff check src/
	black --check src/

format:
	black src/
	ruff check --fix src/