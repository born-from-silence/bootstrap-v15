# AWS Lambda Boilerplate

Handler Python para AWS Lambda.

## Estrutura
```
aws-lambda/
├── handler.py      # Entry point
├── utils.py        # Helpers
├── requirements.txt
└── template.yaml   # SAM/CloudFormation
```

## Deploy
```bash
# Local test
python -m pytest

# Deploy com SAM
sam build
sam deploy --guided
```