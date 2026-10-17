@echo off
title NFT Logistics - Gerador Rapido de Etiquetas PDF
echo ======================================================================
echo   NFT LOGISTICS - GERADOR RAPIDO DE ETIQUETAS EM PDF (PYTHON)
echo ======================================================================
echo.
echo [1] Gerar Etiquetas de IMPORTACAO (modelo_importacao_exemplo.xlsx)
echo [2] Gerar Etiquetas de EXPORTACAO (modelo_exportacao_exemplo.xlsx)
echo [3] Informar caminho de outra planilha Excel
echo.
set /p op="Selecione uma opcao (1, 2 ou 3): "

if "%op%"=="1" (
    echo Gerando PDF de Importacao...
    python gerar_etiquetas_pdf.py --planilha modelo_importacao_exemplo.xlsx --operacao importacao
)
if "%op%"=="2" (
    echo Gerando PDF de Exportacao...
    python gerar_etiquetas_pdf.py --planilha modelo_exportacao_exemplo.xlsx --operacao exportacao
)
if "%op%"=="3" (
    set /p arq="Digite o nome ou caminho do arquivo Excel: "
    set /p tipo="Digite o tipo (importacao ou exportacao): "
    python gerar_etiquetas_pdf.py --planilha "%arq%" --operacao "%tipo%"
)

echo.
echo Concluido! Pressione qualquer tecla para sair...
pause >nul
