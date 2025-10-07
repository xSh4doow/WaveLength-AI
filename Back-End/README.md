# WaveLength Backend

Backend FastAPI com BLIP + MusicGen para geração de música a partir de imagens.

## Estrutura

```
Back-End/
├── src/
│   ├── models/          # BLIP, MusicGen handlers
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   └── main.py          # FastAPI app
├── tests/               # Testes unitários
│   ├── test_models/
│   ├── test_services/
│   ├── test_utils/
│   └── test_main.py
├── pytest.ini           # Config pytest
├── .pylintrc            # Config pylint
└── pyproject.toml       # Config black, isort, mypy
```

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Rodar

```bash
uvicorn src.main:app --reload
```

## Testes

```bash
# Rodar todos os testes
pytest

# Com coverage
pytest --cov=src --cov-report=html

# Específico
pytest tests/test_services/test_cultural_mapper.py -v
```

## Qualidade

```bash
# Formatar
black src tests

# Lint
pylint src

# Type check
mypy src

# Tudo de uma vez
black src tests && pylint src && pytest --cov=src
```

## Testes Implementados

✅ `test_services/test_cultural_mapper.py` - 15 testes
✅ `test_services/test_prompt_builder.py` - 8 testes
✅ `test_utils/test_audio_utils.py` - 4 testes
✅ `test_main.py` - 8 testes

**Total:** 35+ testes configurados para 90%+ coverage

## Adicionar Mais Testes

Para alcançar 100% coverage, crie:

1. `tests/test_models/test_blip_handler.py`
2. `tests/test_models/test_musicgen_handler.py`

Use fixtures de `conftest.py`:
- `mock_blip_model`, `mock_blip_processor`
- `mock_musicgen_model`, `mock_musicgen_processor`
- `test_image`, `test_audio`
