"""
NFT Logistics - Gerador de Etiquetas de Caixas para Feiras & Eventos (COMEX)
Gera PDF no padrão A4 com 2 etiquetas A5 por folha a partir de uma planilha Excel.
Layout com logo completo, referência destacada sem tag REF, status central em largura total,
e volumes em largura total com números ampliados (sem QR code).
"""

import sys
import os
import argparse
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth

# Cores Oficiais NFT Logistics
COLOR_NFT_ORANGE = colors.HexColor('#ea5b27')
COLOR_NFT_DARK = colors.HexColor('#12161f')
COLOR_BG_LIGHT = colors.HexColor('#f8fafc')
COLOR_BORDER = colors.HexColor('#cbd5e1')
COLOR_TEXT_MAIN = colors.HexColor('#0f172a')
COLOR_TEXT_MUTED = colors.HexColor('#64748b')

def mm_to_pt(mm):
    return mm * (72.0 / 25.4)

def normalizar_coluna(col_name):
    if not isinstance(col_name, str):
        return ''
    c = col_name.lower().strip()
    c = c.replace('á', 'a').replace('ã', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ç', 'c')
    return ''.join(ch for ch in c if ch.isalnum())

def encontrar_coluna(df, nomes_possiveis):
    for nome in nomes_possiveis:
        norm_alvo = normalizar_coluna(nome)
        for col in df.columns:
            if norm_alvo in normalizar_coluna(col) or normalizar_coluna(col) in norm_alvo:
                return col
    return None

def normalizar_tipo_carga(val, padrao='Temporary'):
    if not val or pd.isna(val):
        return padrao
    s = str(val).lower().strip()
    if s.startswith('temp') or 'temporar' in s:
        return 'Temporary'
    if s.startswith('def') or 'definitiv' in s:
        return 'Definitive'
    if s.startswith('emp') or 'vazi' in s:
        return 'Empty'
    if s.startswith('ful') or 'chei' in s:
        return 'Full'
    if s.startswith('fra') or 'fragil' in s:
        return 'Fragile'
    return padrao

def desenhar_etiqueta_a5(c, origin_x, origin_y, dados, operacao, logo_full_path, logo_icon_path):
    """
    Desenha uma etiqueta A5 (210mm x 148.5mm) no canvas.
    origin_x e origin_y correspondem ao canto inferior esquerdo da etiqueta.
    """
    w_mm = 210.0
    h_mm = 148.5
    w_pt = mm_to_pt(w_mm)
    h_pt = mm_to_pt(h_mm)

    margem_x = mm_to_pt(6.0)
    margem_y = mm_to_pt(5.0)

    box_x = origin_x + margem_x
    box_y = origin_y + margem_y
    box_w = w_pt - (margem_x * 2)
    box_h = h_pt - (margem_y * 2)

    topo_y = box_y + box_h
    is_import = (operacao == 'importacao')

    c.saveState()

    # 1. Borda externa da etiqueta A5
    c.setStrokeColor(COLOR_BORDER)
    c.setFillColor(colors.white)
    c.setLineWidth(0.8)
    c.roundRect(box_x, box_y, box_w, box_h, mm_to_pt(2.5), fill=1, stroke=1)

    # 2. TOPO: Logo Completo "nft_logo_completo-black.png" (esquerda) + Caixa REF Centralizada (direita)
    # (Removido o badge do centro conforme solicitado)
    header_y = topo_y - mm_to_pt(15)

    # Logo completo NFT
    if os.path.exists(logo_full_path):
        # 1024 x 168 px (~6:1) -> 58mm x 9.5mm
        c.drawImage(logo_full_path, box_x + mm_to_pt(4), header_y + mm_to_pt(1.5), width=mm_to_pt(58), height=mm_to_pt(9.5), mask='auto')
    elif os.path.exists(logo_icon_path):
        c.drawImage(logo_icon_path, box_x + mm_to_pt(4), header_y + mm_to_pt(0.5), width=mm_to_pt(26), height=mm_to_pt(14.5), mask='auto')
    else:
        c.setFont('Helvetica-Bold', 16)
        c.setFillColor(COLOR_NFT_DARK)
        c.drawString(box_x + mm_to_pt(4), header_y + mm_to_pt(3), 'NFT LOGISTICS')

    # Caixa da Referência no Topo Direito (sem o texto "REF", com fonte maior, centralizada)
    ref_w = mm_to_pt(105)
    ref_h = mm_to_pt(13.5)
    ref_x = box_x + box_w - ref_w - mm_to_pt(4)
    ref_y = header_y

    c.setFillColor(colors.white)
    c.setStrokeColor(COLOR_NFT_ORANGE)
    c.setLineWidth(1.8)
    c.roundRect(ref_x, ref_y, ref_w, ref_h, mm_to_pt(3), fill=1, stroke=1)

    # Referência centralizada e em tamanho de fonte ampliado
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(COLOR_TEXT_MAIN)
    ref_val = str(dados.get('referencia', 'NFT-REF-0000'))
    c.drawCentredString(ref_x + ref_w / 2, ref_y + mm_to_pt(3.8), ref_val)

    # 3. Linha Horizontal Divisória (Preta, marcante)
    line_y = header_y - mm_to_pt(3)
    c.setStrokeColor(COLOR_NFT_DARK)
    c.setLineWidth(1.8)
    c.line(box_x + mm_to_pt(2), line_y, box_x + box_w - mm_to_pt(2), line_y)

    # 4. DISTRIBUIÇÃO DAS INFORMAÇÕES (CLIENTE / FEIRA / DESTINO / OBSERVAÇÕES)
    info_top_y = line_y - mm_to_pt(3)
    
    col_left_x = box_x + mm_to_pt(4)
    col_left_w = mm_to_pt(124)

    # Expositor (com quebra de linha quando longo)
    c.setFont('Helvetica-Bold', 6.8)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(col_left_x, info_top_y - mm_to_pt(2), 'EXPOSITOR / EXHIBITOR (CLIENTE):')

    expositor_str = str(dados.get('expositor', 'EXPOSITOR')).upper()
    exp_words = expositor_str.split()
    exp_l1, exp_l2 = "", ""
    for w in exp_words:
        if len(exp_l1 + " " + w) <= 38 and not exp_l2:
            exp_l1 = (exp_l1 + " " + w).strip()
        else:
            exp_l2 = (exp_l2 + " " + w).strip()
    if not exp_l1:
        exp_l1 = expositor_str[:38]

    exp_font_size = 11.5 if exp_l2 else 13.5
    c.setFont('Helvetica-Bold', exp_font_size)
    c.setFillColor(COLOR_TEXT_MAIN)
    c.drawString(col_left_x, info_top_y - mm_to_pt(7.2), exp_l1)
    after_exp_y = info_top_y - mm_to_pt(12)
    if exp_l2:
        c.drawString(col_left_x, info_top_y - mm_to_pt(11.5), exp_l2[:42])
        after_exp_y = info_top_y - mm_to_pt(16)

    # Feira ou Consignatário (com quebra de linha)
    if is_import:
        c.setFont('Helvetica-Bold', 6.5)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.drawString(col_left_x, after_exp_y - mm_to_pt(0.5), 'FEIRA / EVENTO (DESTINATION EVENT):')

        c.setFont('Helvetica-Bold', 10.5)
        c.setFillColor(COLOR_NFT_ORANGE)
        feira_str = str(dados.get('feira', 'FEIRA INTERNACIONAL')).upper()
        f_words = feira_str.split()
        f_l1, f_l2 = "", ""
        for w in f_words:
            if len(f_l1 + " " + w) <= 40 and not f_l2:
                f_l1 = (f_l1 + " " + w).strip()
            else:
                f_l2 = (f_l2 + " " + w).strip()
        if not f_l1:
            f_l1 = feira_str[:40]
        c.drawString(col_left_x, after_exp_y - mm_to_pt(4.5), f_l1)
        after_f_y = after_exp_y - mm_to_pt(8.5)
        if f_l2:
            c.drawString(col_left_x, after_exp_y - mm_to_pt(8.5), f_l2[:44])
            after_f_y = after_exp_y - mm_to_pt(12.5)

        if dados.get('estande'):
            c.setFont('Helvetica-Bold', 8)
            c.setFillColor(COLOR_TEXT_MAIN)
            c.drawString(col_left_x, after_f_y - mm_to_pt(0.2), f"ESTANDE / LOCAL: {str(dados.get('estande'))[:45]}")
    else:
        c.setFont('Helvetica-Bold', 6.5)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.drawString(col_left_x, after_exp_y - mm_to_pt(0.5), 'CONSIGNATÁRIO / CONSIGNEE (DESTINATÁRIO NO EXTERIOR):')

        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(COLOR_TEXT_MAIN)
        cons_str = str(dados.get('consignatario', 'CONSIGNEE')).upper()
        c_words = cons_str.split()
        c_l1, c_l2 = "", ""
        for w in c_words:
            if len(c_l1 + " " + w) <= 40 and not c_l2:
                c_l1 = (c_l1 + " " + w).strip()
            else:
                c_l2 = (c_l2 + " " + w).strip()
        if not c_l1:
            c_l1 = cons_str[:40]
        c.drawString(col_left_x, after_exp_y - mm_to_pt(4.5), c_l1)
        after_c_y = after_exp_y - mm_to_pt(8.5)
        if c_l2:
            c.drawString(col_left_x, after_exp_y - mm_to_pt(8.5), c_l2[:44])
            after_c_y = after_exp_y - mm_to_pt(12.5)

        if dados.get('destino'):
            c.setFont('Helvetica-Bold', 8.5)
            c.setFillColor(COLOR_NFT_ORANGE)
            c.drawString(col_left_x, after_c_y - mm_to_pt(0.2), f"DESTINO FINAL: {str(dados.get('destino'))[:42].upper()}")

    # Coluna Direita: Box de Observações / Notas (Regime Aduaneiro removido)
    card_x = box_x + box_w - mm_to_pt(64)
    card_y = info_top_y - mm_to_pt(21)
    card_w = mm_to_pt(60)
    card_h = mm_to_pt(21)

    c.setFillColor(COLOR_BG_LIGHT)
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(0.7)
    c.roundRect(card_x, card_y, card_w, card_h, mm_to_pt(2), fill=1, stroke=1)

    c.setFont('Helvetica-Bold', 7)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(card_x + mm_to_pt(3), card_y + card_h - mm_to_pt(5), 'OBSERVAÇÕES / NOTAS:')

    c.setFont('Helvetica', 7.5)
    c.setFillColor(COLOR_TEXT_MAIN)
    obs_txt = str(dados.get('observacoes', '')).strip()
    if not obs_txt or obs_txt.lower() == 'nan':
        obs_txt = 'Sem observações adicionais'
    
    # Quebra em até 2 linhas caso necessário
    words = obs_txt.split()
    line1 = ""
    line2 = ""
    for w in words:
        if len(line1 + " " + w) <= 34 and not line2:
            line1 = (line1 + " " + w).strip()
        else:
            line2 = (line2 + " " + w).strip()
    if not line1:
        line1 = obs_txt[:34]
    c.drawString(card_x + mm_to_pt(3), card_y + card_h - mm_to_pt(9.5), line1)
    if line2:
        c.drawString(card_x + mm_to_pt(3), card_y + card_h - mm_to_pt(14), line2[:34])

    # 5. O DESTAQUE CENTRAL: "TEMPORARY", "DEFINITIVE", "EMPTY", "FULL" OU "FRAGILE"
    # Pegando a largura toda da etiqueta, bem no centro, bem visível!
    center_y = box_y + mm_to_pt(55)
    tipo_carga = str(dados.get('tipoCarga', 'TEMPORARY')).upper()

    # Título ainda maior pegando o centro de forma marcante
    c.setFont('Helvetica-Bold', 52)
    c.setFillColor(COLOR_NFT_DARK)
    c.drawCentredString(box_x + box_w / 2, center_y, tipo_carga)

    # 6. PARTE INFERIOR: VOLUMES LARGURA TOTAL ALINHADOS AO BOTTOM
    # Margem inferior de 4mm, idêntica às margens laterais de 4mm
    vol_x = box_x + mm_to_pt(4)
    vol_w = box_w - mm_to_pt(8)  # Largura total com 4mm de cada lado

    b_gap = mm_to_pt(18)  # espaço para o "OF"
    b_w = (vol_w - b_gap) / 2
    b_h = mm_to_pt(28)

    # Base dos volumes colada no bottom com margem de 4mm (igual às laterais)
    b1_x = vol_x
    b1_y = box_y + mm_to_pt(4)
    b2_x = vol_x + b_w + b_gap
    b2_y = b1_y

    # Título VOLUMES logo acima das caixas
    c.setFont('Helvetica-Bold', 12.5)
    c.setFillColor(COLOR_NFT_DARK)
    c.drawString(vol_x + mm_to_pt(1), b1_y + b_h + mm_to_pt(2.5), 'VOLUMES')

    # Caixa 1 (Volume Atual)
    c.setFillColor(colors.white)
    c.setStrokeColor(COLOR_BORDER)
    c.setLineWidth(1.2)
    c.roundRect(b1_x, b1_y, b_w, b_h, mm_to_pt(3), fill=1, stroke=1)

    # Número do Volume Atual AINDA MAIOR (40pt)
    c.setFont('Helvetica-Bold', 40)
    c.setFillColor(COLOR_TEXT_MAIN)
    c.drawCentredString(b1_x + b_w / 2, b1_y + mm_to_pt(8.5), str(dados.get('volumeAtual', 1)))

    # "OF" Centralizado
    c.setFont('Helvetica-Bold', 16)
    c.setFillColor(COLOR_NFT_DARK)
    c.drawCentredString(vol_x + b_w + b_gap / 2, b1_y + mm_to_pt(11), 'OF')

    # Caixa 2 (Total Volumes)
    c.setFillColor(colors.white)
    c.setStrokeColor(COLOR_BORDER)
    c.setLineWidth(1.2)
    c.roundRect(b2_x, b2_y, b_w, b_h, mm_to_pt(3), fill=1, stroke=1)

    # Número do Total de Volumes AINDA MAIOR (40pt)
    c.setFont('Helvetica-Bold', 40)
    c.setFillColor(COLOR_TEXT_MAIN)
    c.drawCentredString(b2_x + b_w / 2, b2_y + mm_to_pt(8.5), str(dados.get('totalVolumes', 1)))

    # 7. Rodapé de conformidade aduaneira removido a pedido do usuário

    c.restoreState()

def desenhar_etiqueta_termica_10x15(c, origin_x, origin_y, dados, operacao, logo_full_path, logo_icon_path):
    """
    Desenha uma etiqueta Térmica 10cm x 15cm (100mm x 150mm) no canvas.
    origin_x e origin_y correspondem ao canto inferior esquerdo da etiqueta.
    """
    w_mm = 100.0
    h_mm = 150.0
    w_pt = mm_to_pt(w_mm)
    h_pt = mm_to_pt(h_mm)

    margem_x = mm_to_pt(3.5)
    margem_y = mm_to_pt(3.5)

    box_x = origin_x + margem_x
    box_y = origin_y + margem_y
    box_w = w_pt - (margem_x * 2)
    box_h = h_pt - (margem_y * 2)
    topo_y = box_y + box_h

    is_import = (operacao.lower() == 'importacao')

    c.saveState()

    # 1. Borda externa da etiqueta 10x15
    c.setStrokeColor(COLOR_BORDER)
    c.setFillColor(colors.white)
    c.setLineWidth(0.8)
    c.roundRect(box_x, box_y, box_w, box_h, mm_to_pt(2.5), fill=1, stroke=1)

    # 2. TOPO: Cabeçalho Distribuído - Logo (Linha 1) + Caixa REF (Linha 2)
    logo_w = mm_to_pt(48)
    logo_h = mm_to_pt(7.8)
    logo_x = box_x + (box_w - logo_w) / 2
    logo_y = topo_y - mm_to_pt(10.5)

    if os.path.exists(logo_full_path):
        c.drawImage(logo_full_path, logo_x, logo_y, width=logo_w, height=logo_h, mask='auto')
    else:
        c.setFont('Helvetica-Bold', 12)
        c.setFillColor(COLOR_NFT_DARK)
        c.drawCentredString(box_x + box_w / 2, logo_y + mm_to_pt(2.5), 'NFT LOGISTICS')

    # Caixa da Referência no Topo (Largura Total)
    ref_w = box_w - mm_to_pt(5)
    ref_h = mm_to_pt(9.5)
    ref_x = box_x + mm_to_pt(2.5)
    ref_y = logo_y - mm_to_pt(11.5)

    c.setFillColor(colors.white)
    c.setStrokeColor(COLOR_NFT_ORANGE)
    c.setLineWidth(1.5)
    c.roundRect(ref_x, ref_y, ref_w, ref_h, mm_to_pt(2.5), fill=1, stroke=1)

    ref_val = str(dados.get('referencia', 'NFT-REF-0000'))
    ref_font_size = 10 if len(ref_val) > 20 else 13
    c.setFont('Helvetica-Bold', ref_font_size)
    c.setFillColor(COLOR_TEXT_MAIN)
    c.drawCentredString(ref_x + ref_w / 2, ref_y + mm_to_pt(2.8), ref_val)

    # Linha Horizontal Divisória Marcante
    line_y = ref_y - mm_to_pt(2.5)
    c.setStrokeColor(COLOR_NFT_DARK)
    c.setLineWidth(1.5)
    c.line(box_x + mm_to_pt(2), line_y, box_x + box_w - mm_to_pt(2), line_y)

    # 3. DISTRIBUIÇÃO DAS INFORMAÇÕES COM QUEBRA DE LINHA
    info_top_y = line_y - mm_to_pt(1.5)

    # Expositor (com quebra de linha)
    c.setFont('Helvetica-Bold', 6)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(box_x + mm_to_pt(2.5), info_top_y - mm_to_pt(2.5), 'EXPOSITOR / EXHIBITOR (CLIENTE):')

    c.setFont('Helvetica-Bold', 9.5)
    c.setFillColor(COLOR_TEXT_MAIN)
    expositor_str = str(dados.get('expositor', 'EXPOSITOR')).upper()
    exp_words = expositor_str.split()
    exp_l1 = ""
    exp_l2 = ""
    for w in exp_words:
        if len(exp_l1 + " " + w) <= 32 and not exp_l2:
            exp_l1 = (exp_l1 + " " + w).strip()
        else:
            exp_l2 = (exp_l2 + " " + w).strip()
    if not exp_l1:
        exp_l1 = expositor_str[:32]
    c.drawString(box_x + mm_to_pt(2.5), info_top_y - mm_to_pt(6.2), exp_l1)
    next_info_y = info_top_y - mm_to_pt(9.5)
    if exp_l2:
        c.drawString(box_x + mm_to_pt(2.5), info_top_y - mm_to_pt(9.8), exp_l2[:32])
        next_info_y = info_top_y - mm_to_pt(13.2)

    # Feira ou Consignatário (com quebra de linha)
    if is_import:
        c.setFont('Helvetica-Bold', 6)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.drawString(box_x + mm_to_pt(2.5), next_info_y - mm_to_pt(2.5), 'FEIRA / EVENTO (DESTINATION EVENT):')

        c.setFont('Helvetica-Bold', 8.5)
        c.setFillColor(COLOR_NFT_ORANGE)
        feira_str = str(dados.get('feira', 'FEIRA INTERNACIONAL')).upper()
        feira_words = feira_str.split()
        f_l1, f_l2 = "", ""
        for w in feira_words:
            if len(f_l1 + " " + w) <= 34 and not f_l2:
                f_l1 = (f_l1 + " " + w).strip()
            else:
                f_l2 = (f_l2 + " " + w).strip()
        if not f_l1:
            f_l1 = feira_str[:34]
        c.drawString(box_x + mm_to_pt(2.5), next_info_y - mm_to_pt(6), f_l1)
        after_feira_y = next_info_y - mm_to_pt(9)
        if f_l2:
            c.drawString(box_x + mm_to_pt(2.5), next_info_y - mm_to_pt(9.2), f_l2[:34])
            after_feira_y = next_info_y - mm_to_pt(12.2)

        if dados.get('estande'):
            c.setFont('Helvetica-Bold', 7)
            c.setFillColor(COLOR_TEXT_MAIN)
            c.drawString(box_x + mm_to_pt(2.5), after_feira_y - mm_to_pt(0.5), f"ESTANDE / LOCAL: {str(dados.get('estande'))[:34]}")
    else:
        c.setFont('Helvetica-Bold', 6)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.drawString(box_x + mm_to_pt(2.5), next_info_y - mm_to_pt(2.5), 'CONSIGNATÁRIO / CONSIGNEE (EXTERIOR):')

        c.setFont('Helvetica-Bold', 8)
        c.setFillColor(COLOR_TEXT_MAIN)
        cons_str = str(dados.get('consignatario', 'CONSIGNEE')).upper()
        cons_words = cons_str.split()
        c_l1, c_l2 = "", ""
        for w in cons_words:
            if len(c_l1 + " " + w) <= 34 and not c_l2:
                c_l1 = (c_l1 + " " + w).strip()
            else:
                c_l2 = (c_l2 + " " + w).strip()
        if not c_l1:
            c_l1 = cons_str[:34]
        c.drawString(box_x + mm_to_pt(2.5), next_info_y - mm_to_pt(6), c_l1)
        after_cons_y = next_info_y - mm_to_pt(9)
        if c_l2:
            c.drawString(box_x + mm_to_pt(2.5), next_info_y - mm_to_pt(9.2), c_l2[:34])
            after_cons_y = next_info_y - mm_to_pt(12.2)

        if dados.get('destino'):
            c.setFont('Helvetica-Bold', 7)
            c.setFillColor(COLOR_NFT_ORANGE)
            c.drawString(box_x + mm_to_pt(2.5), after_cons_y - mm_to_pt(0.5), f"DESTINO FINAL: {str(dados.get('destino'))[:32].upper()}")

    # Box de Observações / Notas
    card_x = box_x + mm_to_pt(2.5)
    card_y = box_y + mm_to_pt(74)
    card_w = box_w - mm_to_pt(5)
    card_h = mm_to_pt(13.5)

    c.setFillColor(COLOR_BG_LIGHT)
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(0.6)
    c.roundRect(card_x, card_y, card_w, card_h, mm_to_pt(2), fill=1, stroke=1)

    c.setFont('Helvetica-Bold', 6)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(card_x + mm_to_pt(2.5), card_y + card_h - mm_to_pt(4), 'OBSERVAÇÕES / NOTAS:')

    c.setFont('Helvetica', 6.5)
    c.setFillColor(COLOR_TEXT_MAIN)
    obs_txt = str(dados.get('observacoes', '')).strip()
    if not obs_txt or obs_txt.lower() == 'nan':
        obs_txt = 'Sem observações adicionais'
    
    words = obs_txt.split()
    line1 = ""
    line2 = ""
    for w in words:
        if len(line1 + " " + w) <= 48 and not line2:
            line1 = (line1 + " " + w).strip()
        else:
            line2 = (line2 + " " + w).strip()
    if not line1:
        line1 = obs_txt[:48]
    c.drawString(card_x + mm_to_pt(2.5), card_y + card_h - mm_to_pt(8), line1)
    if line2:
        c.drawString(card_x + mm_to_pt(2.5), card_y + card_h - mm_to_pt(11.5), line2[:48])

    # 4. DESTAQUE CENTRAL (36pt)
    center_y = box_y + mm_to_pt(49)
    tipo_carga = str(dados.get('tipoCarga', 'TEMPORARY')).upper()

    c.setFont('Helvetica-Bold', 36)
    c.setFillColor(COLOR_NFT_DARK)
    c.drawCentredString(box_x + box_w / 2, center_y, tipo_carga)

    # 5. VOLUMES ALINHADOS AO BOTTOM
    vol_x = box_x + mm_to_pt(2.5)
    vol_w = box_w - mm_to_pt(5)

    b_gap = mm_to_pt(14)
    b_w = (vol_w - b_gap) / 2
    b_h = mm_to_pt(30)

    b1_x = vol_x
    b1_y = box_y + mm_to_pt(3.5)
    b2_x = vol_x + b_w + b_gap
    b2_y = b1_y

    # Título VOLUMES
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(COLOR_NFT_DARK)
    c.drawString(vol_x + mm_to_pt(1), b1_y + b_h + mm_to_pt(2), 'VOLUMES')

    # Caixa 1 (Volume Atual)
    c.setFillColor(colors.white)
    c.setStrokeColor(COLOR_BORDER)
    c.setLineWidth(1.1)
    c.roundRect(b1_x, b1_y, b_w, b_h, mm_to_pt(2.5), fill=1, stroke=1)

    c.setFont('Helvetica-Bold', 36)
    c.setFillColor(COLOR_TEXT_MAIN)
    c.drawCentredString(b1_x + b_w / 2, b1_y + mm_to_pt(9), str(dados.get('volumeAtual', 1)))

    # "OF" Centralizado
    c.setFont('Helvetica-Bold', 14)
    c.setFillColor(COLOR_NFT_DARK)
    c.drawCentredString(vol_x + b_w + b_gap / 2, b1_y + mm_to_pt(11.5), 'OF')

    # Caixa 2 (Total Volumes)
    c.setFillColor(colors.white)
    c.setStrokeColor(COLOR_BORDER)
    c.setLineWidth(1.1)
    c.roundRect(b2_x, b2_y, b_w, b_h, mm_to_pt(2.5), fill=1, stroke=1)

    c.setFont('Helvetica-Bold', 36)
    c.setFillColor(COLOR_TEXT_MAIN)
    c.drawCentredString(b2_x + b_w / 2, b2_y + mm_to_pt(9), str(dados.get('totalVolumes', 1)))

    c.restoreState()

def gerar_pdf_etiquetas(caminho_excel, operacao='importacao', arquivo_saida=None, tipo_padrao='Temporary', formato='a4'):
    if not os.path.exists(caminho_excel):
        raise FileNotFoundError(f"Planilha não encontrada: {caminho_excel}")

    df = pd.read_excel(caminho_excel)

    col_expositor = encontrar_coluna(df, ['nome do expositor', 'expositor', 'cliente', 'exhibitor'])
    col_volumes = encontrar_coluna(df, ['quantidade de volumes', 'qtd volumes', 'volumes', 'total volumes', 'volume', 'qtd'])
    col_ref = encontrar_coluna(df, ['referencia interna', 'referencia', 'ref interna', 'ref nft', 'processo', 'ref'])
    col_tipo = encontrar_coluna(df, ['tipo de carga', 'tipo carga', 'tipo', 'status', 'categoria', 'category', 'regime', 'modalidade'])
    col_feira = encontrar_coluna(df, ['nome da feira', 'feira', 'evento', 'fair'])
    col_estande = encontrar_coluna(df, ['estande', 'stand', 'local', 'pavilhao'])
    col_consignatario = encontrar_coluna(df, ['consignatario da carga', 'consignatario', 'consignee', 'destinatario'])
    col_destino = encontrar_coluna(df, ['pais de destino', 'destino', 'cidade', 'country'])
    col_obs = encontrar_coluna(df, ['observacoes', 'observacao', 'notas'])

    lista_etiquetas = []
    for idx, row in df.iterrows():
        expositor = str(row[col_expositor]) if col_expositor and pd.notna(row[col_expositor]) else f"Expositor {idx+1}"
        ref = str(row[col_ref]) if col_ref and pd.notna(row[col_ref]) else f"NFT-{idx+1:04d}"
        
        try:
            total_vol = int(row[col_volumes]) if col_volumes else 1
            if total_vol < 1:
                total_vol = 1
        except Exception:
            total_vol = 1

        tipo_carga = normalizar_tipo_carga(row[col_tipo], padrao=tipo_padrao) if col_tipo else tipo_padrao
        feira = str(row[col_feira]) if col_feira and pd.notna(row[col_feira]) else ''
        estande = str(row[col_estande]) if col_estande and pd.notna(row[col_estande]) else ''
        consignatario = str(row[col_consignatario]) if col_consignatario and pd.notna(row[col_consignatario]) else ''
        destino = str(row[col_destino]) if col_destino and pd.notna(row[col_destino]) else ''
        observacoes = str(row[col_obs]) if col_obs and pd.notna(row[col_obs]) else ''

        for v in range(1, total_vol + 1):
            lista_etiquetas.append({
                'expositor': expositor,
                'referencia': ref,
                'volumeAtual': v,
                'totalVolumes': total_vol,
                'tipoCarga': tipo_carga,
                'feira': feira,
                'estande': estande,
                'consignatario': consignatario,
                'destino': destino,
                'observacoes': observacoes,
            })

    if not lista_etiquetas:
        print("Nenhuma etiqueta para gerar.")
        return

    is_thermal = (formato.lower() == '10x15')

    if not arquivo_saida:
        fmt_str = "termica_10x15" if is_thermal else "A4"
        arquivo_saida = f"Etiquetas_NFT_{operacao}_{fmt_str}_{len(lista_etiquetas)}_volumes.pdf"

    logo_full = os.path.join(os.path.dirname(__file__), 'img', 'nft_logo_completo-black.png')
    logo_icon = os.path.join(os.path.dirname(__file__), 'img', 'nft_logo_icon.png')
    total_etiquetas = len(lista_etiquetas)

    if is_thermal:
        # Padrão Térmica 10cm x 15cm (100mm x 150mm) individual por página
        page_size = (mm_to_pt(100), mm_to_pt(150))
        c = canvas.Canvas(arquivo_saida, pagesize=page_size)

        for i in range(total_etiquetas):
            dados = lista_etiquetas[i]
            if i > 0:
                c.showPage()
            desenhar_etiqueta_termica_10x15(c, 0, 0, dados, operacao, logo_full, logo_icon)

        c.save()
        print(f"Sucesso! PDF Térmico (10x15 cm) gerado com {total_etiquetas} etiquetas: {arquivo_saida}")
    else:
        # Padrão A4 com 2 etiquetas A5 por folha
        c = canvas.Canvas(arquivo_saida, pagesize=A4)
        page_w_pt, page_h_pt = A4
        meio_h_pt = page_h_pt / 2.0

        for i in range(total_etiquetas):
            dados = lista_etiquetas[i]
            is_top = (i % 2 == 0)

            if i > 0 and is_top:
                c.showPage()

            origin_y = meio_h_pt if is_top else 0
            origin_x = 0

            if is_top:
                c.saveState()
                c.setStrokeColor(colors.HexColor('#94a3b8'))
                c.setDash(3, 3)
                c.setLineWidth(0.5)
                c.line(mm_to_pt(4), meio_h_pt, page_w_pt - mm_to_pt(4), meio_h_pt)
                c.restoreState()

            desenhar_etiqueta_a5(c, origin_x, origin_y, dados, operacao, logo_full, logo_icon)

        c.save()
        print(f"Sucesso! PDF A4 gerado com {total_etiquetas} etiquetas: {arquivo_saida}")

    return arquivo_saida

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Gerador de Etiquetas NFT Logistics para Feiras')
    parser.add_argument('--planilha', '-p', default='modelo_importacao_exemplo.xlsx', help='Caminho para o Excel (.xlsx)')
    parser.add_argument('--operacao', '-o', default='importacao', choices=['importacao', 'exportacao'], help='Tipo de operação')
    parser.add_argument('--tipo', '-t', default='Temporary', choices=['Temporary', 'Definitive', 'Empty', 'Full', 'Fragile'], help='Tipo/Status central padrão da carga')
    parser.add_argument('--formato', '-f', default='a4', choices=['a4', '10x15'], help='Formato da folha: a4 (2 etiquetas A5 por folha) ou 10x15 (etiqueta térmica individual)')
    parser.add_argument('--saida', '-s', default=None, help='Nome do arquivo PDF de saída')

    args = parser.parse_args()
    gerar_pdf_etiquetas(args.planilha, args.operacao, args.saida, args.tipo, args.formato)

