# CRLVs de exemplo (dados fictícios)

Arquivos para testar a importação de CRLV no Drivo sem usar documentos reais.
**Todos os dados são inventados** e cada página traz a marca d'água "DOCUMENTO FICTÍCIO".

| Arquivo | Formato | O que testa | Placa |
| :--- | :--- | :--- | :--- |
| `crlv-exemplo-1-corolla.pdf` | PDF | Leitura de PDF; prefixo `I/` na marca (`I/TOYOTA COROLLA ALTIS HYBRID`) | `ABC1D23` |
| `crlv-exemplo-2-moto.png` | PNG | Motocicleta, marca/modelo no formato `YAMAHA/MT-03 ABS` | `JKL4M56` |
| `crlv-exemplo-3-foto-celular.jpg` | JPG | "Foto de celular": inclinada, com ruído e desfoque | `PQR7S89` |

As placas não existem no seed, então dá para salvar os três veículos sem conflito.

Como usar: em `/veiculos/novo`, painel **Importar CRLV** → **Escolher arquivo**. Requer `GEMINI_API_KEY`
configurada (ou `GEMINI_MOCK=true`, que devolve sempre um exemplo fixo e não lê o arquivo).
