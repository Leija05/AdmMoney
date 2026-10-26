import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Omitir header y footer en la primera página o poner versión limpia
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 755, "LUCKY COOKIES • PLAN MAESTRO DE ARQUITECTURA, CONTROL & ACTUALIZACIONES")
            self.setFont("Helvetica", 7.5)
            self.drawRightString(558, 755, "SISTEMA OPERATIVO v2.5")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(54, 747, 558, 747)
            
            # Footer
            self.setFont("Helvetica", 8)
            page_str = f"Página {self._pageNumber} de {page_count}"
            self.drawRightString(558, 38, page_str)
            self.drawString(54, 38, "DOCUMENTO TÉCNICO CONFIDENCIAL • DISTRIBUCIÓN EXCLUSIVA LUCKY COOKIES")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 48, 558, 48)

        self.restoreState()

def create_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0F172A")       # Slate 900
    BRAND = colors.HexColor("#0284C7")         # Sky 600
    BRAND_LIGHT = colors.HexColor("#E0F2FE")   # Sky 100
    GOLD = colors.HexColor("#D97706")          # Amber 600
    GOLD_LIGHT = colors.HexColor("#FEF3C7")    # Amber 100
    TEXT_MAIN = colors.HexColor("#1E293B")     # Slate 800
    TEXT_MUTED = colors.HexColor("#64748B")    # Slate 500
    BG_CARD = colors.HexColor("#F8FAFC")       # Slate 50
    BORDER_LIGHT = colors.HexColor("#E2E8F0")  # Slate 200
    SUCCESS = colors.HexColor("#059669")       # Emerald 600
    SUCCESS_LIGHT = colors.HexColor("#D1FAE5") # Emerald 100
    GITHUB_COLOR = colors.HexColor("#24292F")  # GitHub Dark
    GITHUB_LIGHT = colors.HexColor("#F6F8FA")  # GitHub Gray

    # Typography styles
    title_cover = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=26,
        textColor=PRIMARY,
        alignment=0
    )
    subtitle_cover = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14.5,
        textColor=TEXT_MUTED,
        alignment=0
    )
    h1 = ParagraphStyle(
        'H1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=PRIMARY,
        spaceAfter=6,
        spaceBefore=10,
        keepWithNext=True
    )
    h2 = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=BRAND,
        spaceAfter=5,
        spaceBefore=8,
        keepWithNext=True
    )
    body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.6,
        leading=12.6,
        textColor=TEXT_MAIN,
        spaceAfter=4.5
    )
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body,
        fontName='Helvetica-Bold'
    )
    bullet = ParagraphStyle(
        'Bullet',
        parent=body,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=TEXT_MAIN
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold'
    )
    table_cell_right = ParagraphStyle(
        'TableCellRight',
        parent=table_cell,
        alignment=2
    )
    table_cell_right_bold = ParagraphStyle(
        'TableCellRightBold',
        parent=table_cell_bold,
        alignment=2
    )

    story = []

    # =========================================================================
    # PÁGINA 1: PORTADA EJECUTIVA & INGENIERÍA DE COSTOS
    # =========================================================================
    story.append(Spacer(1, 4))
    story.append(Paragraph("<font color='#0284C7'><b>LUCKY COOKIES • ESPECIFICACIÓN TÉCNICA & OPERATIVA</b></font>", body))
    story.append(Spacer(1, 4))
    
    story.append(Paragraph("Plan Maestro: Pedidos QR sin Anticipo, Control de Producción y Actualizaciones desde GitHub", title_cover))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Guía integral de implementación: Catálogo Web de Pedidos por WhatsApp, Estrategia Anti-Mermas con Auto-Expiración a 45 min, Costeo Unitario ($9.67 MXN), Plan de Horno, Desacoplamiento de Receta vs Stock y Auto-Actualizador In-App desde GitHub Releases.", subtitle_cover))
    story.append(Spacer(1, 8))

    # Meta card table
    meta_data = [
        [Paragraph("<b>Empresa:</b> Lucky Cookies Repostería", table_cell), Paragraph("<b>Fecha de emisión:</b> Octubre 2026", table_cell)],
        [Paragraph("<b>Arquitectura:</b> App Móvil (Expo/React Native) + Portal Web QR", table_cell), Paragraph("<b>Backend:</b> FastAPI & MongoDB Atlas", table_cell)],
        [Paragraph("<b>Estrategia de Actualización:</b> In-App GitHub Releases (Leija05/AdmMoney)", table_cell), Paragraph("<b>Versión del Plan:</b> 2.6.0 (Producción)", table_cell)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, BORDER_LIGHT),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Sección 1: Costos
    story.append(Paragraph("1. Ingeniería de Costos: Galleta de Oreo y Chispas (Cálculo Unitario Real)", h1))
    story.append(Paragraph(
        "A partir de las medidas y costos exactos proporcionados para una tanda estándar de 10 a 11 piezas, se determinó el costo individual de insumos crudos más el empaque para establecer el <b>costo real de producción unitario</b>:",
        body
    ))

    # Tabla 1.1: Costo Unitario
    story.append(Paragraph("Tabla 1.1 — Desglose de Materia Prima y Empaque por Galleta", h2))
    headers_unit = [
        Paragraph("<b>Ingrediente / Insumo</b>", table_cell_bold),
        Paragraph("<b>Gramos / Porción</b>", table_cell),
        Paragraph("<b>Costo Unitario (MXN)</b>", table_cell_right_bold)
    ]
    unit_rows = [
        [Paragraph("Mantequilla de primera", table_cell), Paragraph("15.0 g", table_cell), Paragraph("$2.63", table_cell_right)],
        [Paragraph("Azúcar mascabado", table_cell), Paragraph("10.0 g", table_cell), Paragraph("$0.38", table_cell_right)],
        [Paragraph("Azúcar estándar", table_cell), Paragraph("7.0 g", table_cell), Paragraph("$0.13", table_cell_right)],
        [Paragraph("Huevo fresco", table_cell), Paragraph("1/10 pza (5 g)", table_cell), Paragraph("$0.15", table_cell_right)],
        [Paragraph("Extracto de Vainilla", table_cell), Paragraph("1.0 ml", table_cell), Paragraph("$0.31", table_cell_right)],
        [Paragraph("Harina de trigo premium", table_cell), Paragraph("30.0 g", table_cell), Paragraph("$0.47", table_cell_right)],
        [Paragraph("Polvo para hornear", table_cell), Paragraph("1.0 g", table_cell), Paragraph("$0.09", table_cell_right)],
        [Paragraph("Bicarbonato de sodio", table_cell), Paragraph("1.0 g", table_cell), Paragraph("$0.05", table_cell_right)],
        [Paragraph("Maizena (almidón)", table_cell), Paragraph("2.0 g", table_cell), Paragraph("$0.38", table_cell_right)],
        [Paragraph("Sal refinada", table_cell), Paragraph("1.0 g", table_cell), Paragraph("$0.01", table_cell_right)],
        [Paragraph("Galletas Oreo auténticas", table_cell), Paragraph("1 pza entera troceada", table_cell), Paragraph("$1.25", table_cell_right)],
        [Paragraph("Chispas de chocolate", table_cell), Paragraph("10.0 g", table_cell), Paragraph("$0.93", table_cell_right)],
        [Paragraph("<b>SUBTOTAL MATERIA PRIMA (MASA CRUDA)</b>", table_cell_bold), Paragraph("<b>74.0 g a 77.0 g</b>", table_cell_bold), Paragraph("<b>$6.77</b>", table_cell_right_bold)],
        [Paragraph("Empaque individual grado alimenticio (bolsa/caja + etiqueta)", table_cell), Paragraph("1 unidad", table_cell), Paragraph("$2.90", table_cell_right)],
        [Paragraph("<b>COSTO TOTAL REAL DE PRODUCCIÓN (UNITARIO)</b>", table_cell_bold), Paragraph("<b>Producto Terminado</b>", table_cell_bold), Paragraph("<b>$9.67 MXN</b>", table_cell_right_bold)],
    ]

    unit_table = Table([headers_unit] + unit_rows, colWidths=[234, 150, 120])
    unit_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_LIGHT),
        ('BOTTOMPADDING', (0,0), (-1,0), 3),
        ('TOPPADDING', (0,0), (-1,0), 3),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-3), [colors.white, BG_CARD]),
        ('BACKGROUND', (0,-2), (-1,-2), GOLD_LIGHT),
        ('BACKGROUND', (0,-1), (-1,-1), SUCCESS_LIGHT),
        ('TOPPADDING', (0,1), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(unit_table)
    story.append(Spacer(1, 8))

    # Matriz de Precios
    story.append(Paragraph("Tabla 1.2 — Matriz Estratégica de Precios y Margen de Utilidad", h2))
    profit_headers = [
        Paragraph("<b>Precio de Venta</b>", table_cell_bold),
        Paragraph("<b>Costo Total</b>", table_cell),
        Paragraph("<b>Ganancia Neta / Pza</b>", table_cell_right_bold),
        Paragraph("<b>Margen %</b>", table_cell_right),
        Paragraph("<b>Utilidad / Tanda (10 pzas)</b>", table_cell_right_bold)
    ]
    profit_rows = [
        [Paragraph("$25.00 MXN (Económico)", table_cell_bold), Paragraph("$9.67 MXN", table_cell), Paragraph("+$15.33 MXN", table_cell_right), Paragraph("61.3 %", table_cell_right), Paragraph("+$153.30 MXN", table_cell_right_bold)],
        [Paragraph("$28.00 MXN (Intermedio)", table_cell_bold), Paragraph("$9.67 MXN", table_cell), Paragraph("+$18.33 MXN", table_cell_right), Paragraph("65.5 %", table_cell_right), Paragraph("+$183.30 MXN", table_cell_right_bold)],
        [Paragraph("<b>$30.00 MXN (Recomendado)</b>", table_cell_bold), Paragraph("$9.67 MXN", table_cell), Paragraph("<b>+$20.33 MXN</b>", table_cell_right_bold), Paragraph("<b>67.8 %</b>", table_cell_right), Paragraph("<b>+$203.30 MXN</b>", table_cell_right_bold)],
        [Paragraph("$35.00 MXN (Gourmet / Regalo)", table_cell_bold), Paragraph("$9.67 MXN", table_cell), Paragraph("+$25.33 MXN", table_cell_right), Paragraph("72.4 %", table_cell_right), Paragraph("+$253.30 MXN", table_cell_right_bold)],
    ]
    profit_table = Table([profit_headers] + profit_rows, colWidths=[130, 84, 100, 70, 120])
    profit_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('BACKGROUND', (0,3), (-1,3), SUCCESS_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(profit_table)

    # =========================================================================
    # PÁGINA 2: RECETA VS STOCK & ESTRATEGIA ANTI-BROMAS (SIN ANTICIPOS)
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("2. Desacoplamiento Operativo: Receta Base vs Stock de Vitrina", h1))
    story.append(Paragraph(
        "Para una operación profesional y trazabilidad matemática exacta, la <b>receta</b> y el <b>inventario de producto terminado</b> funcionan en compartimentos totalmente independientes:",
        body
    ))
    story.append(Paragraph("• <b>Ficha de Receta (Configuración Fija de Costos):</b> Define la fórmula matemática invariable (gramajes, insumos crudos, costo estimado de tanda de $108.38 MXN y rendimiento de 10-11 piezas). Permanece inalterada con las ventas diarias.", bullet))
    story.append(Paragraph("• <b>Stock de Galletas Listas (Inventario Físico Vivo):</b> Registra cuántas galletas ya horneadas y empacadas existen hoy en vitrina. Al pulsar <i>'Hornear Tanda'</i>, se suman +10 unidades a este stock y se descuentan los insumos crudos (harina, mantequilla).", bullet))
    story.append(Paragraph("• <b>Descuento Inteligente al Vender:</b> Al registrar una venta o entregar un pedido, se descuenta la unidad de la vitrina sin alterar los costos base de la receta.", bullet))
    story.append(Spacer(1, 6))

    story.append(Paragraph("3. Portal Web de Pedidos QR & Estrategia Anti-Mermas (Sin Anticipos)", h1))
    story.append(Paragraph(
        "Al escanear el Código QR configurado en el empaque o redes, el cliente accede al menú web interactivo. Para evitar pedir transferencias o anticipos que ahuyenten ventas, se implementa un <b>protocolo de blindaje operativo por validación activa en WhatsApp</b>:",
        body
    ))

    # Tarjeta de Estrategia Anti-Mermas
    anti_fraud_data = [
        [Paragraph("<b>ESTRATEGIA BLINDADA CONTRA PEDIDOS FALSOS Y MERMAS (CERO ANTICIPOS)</b>", ParagraphStyle('W', parent=body_bold, textColor=PRIMARY))],
        [Paragraph(
            "<b>1. Estado Inicial 'Pendiente de Confirmación':</b> Al llenar el carrito en la web, el pedido NO entra a la lista de horneado ni descuenta ingredientes. Se guarda congelado en estatus inactivo.<br/>"
            "<b>2. Redirección Forzosa a WhatsApp con Folio Único:</b> La web genera un folio alfanumérico irrepetible (ej. <code>#LK-7392</code>) y abre automáticamente WhatsApp hacia la Línea activa configurada (Línea 1 o Línea 2) con el mensaje prearmado: <i>'¡Hola! Soy Juan Pérez, confirmo mi pedido #LK-7392 de 6 galletas por $180 MXN para entrega hoy a las 5:00 PM'</i>.<br/>"
            "<b>3. Verificación de Identidad Real del Remitente:</b> Al enviar el mensaje por WhatsApp, se valida que el número celular es legítimo y activo. Es imposible usar teléfonos ficticios en la web.<br/>"
            "<b>4. Ventana de Expiración Estricta a 45 Minutos:</b> Si el cliente cierra el navegador y nunca envía el WhatsApp, el backend cancela automáticamente el pedido a los 45 minutos. Cero mermas en horno.<br/>"
            "<b>5. Aprobación en 1 Toque desde la App Móvil:</b> El repostero recibe el mensaje de WhatsApp, valida la disponibilidad y pulsa <b>[ Confirmar y Enviar a Horno ]</b> en la app móvil. Solo entonces se programa la producción.<br/>"
            "<b>6. Rate Limiting por Teléfono e IP:</b> Máximo 1 pedido activo en espera de confirmación por número de teléfono. Evita que un bot o bromista genere múltiples folios seguidos.<br/>"
            "<b>7. Lista Negra de Clientes Bromistas:</b> Si un usuario confirma pero no acude a recoger, el repostero pulsa <b>[ Bloquear Cliente ]</b>. El número queda vetado en la base de datos para futuros pedidos.",
            body
        )]
    ]
    anti_fraud_table = Table(anti_fraud_data, colWidths=[504])
    anti_fraud_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1.5, BRAND),
        ('TOPPADDING', (0,0), (-1,-1), 6.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6.5),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(anti_fraud_table)
    story.append(Spacer(1, 8))

    # Flujo de Estados del Pedido
    story.append(Paragraph("Tabla 2.1 — Ciclo de Vida del Pedido en el Sistema", h2))
    state_headers = [
        Paragraph("<b>Estado</b>", table_cell_bold),
        Paragraph("<b>Disparador / Evento</b>", table_cell_bold),
        Paragraph("<b>¿Entra al Horno?</b>", table_cell_bold),
        Paragraph("<b>Acción Requerida</b>", table_cell_bold)
    ]
    state_rows = [
        [Paragraph("<b>1. Pendiente WhatsApp</b>", table_cell_bold), Paragraph("Cliente finaliza formulario web y genera folio #LK-XXXX.", table_cell), Paragraph("<font color='#DC2626'><b>NO</b> (Congelado)</font>", table_cell), Paragraph("Cliente debe enviar WhatsApp prearmado.", table_cell)],
        [Paragraph("<b>2. Confirmado</b>", table_cell_bold), Paragraph("Repostero valida chat y pulsa [Confirmar] en app.", table_cell), Paragraph("<font color='#059669'><b>SÍ</b> (En cola)</font>", table_cell), Paragraph("Se suma al Plan de Horno del día.", table_cell)],
        [Paragraph("<b>3. Por Hornear / Listo</b>", table_cell_bold), Paragraph("Se hornea la tanda y se empaca.", table_cell), Paragraph("Horneado completado", table_cell), Paragraph("Se notifica al cliente que su pedido está listo.", table_cell)],
        [Paragraph("<b>4. Entregado / Pagado</b>", table_cell_bold), Paragraph("Cliente recoge y liquida en efectivo o transferencia.", table_cell), Paragraph("Cerrado", table_cell), Paragraph("Se registra ingreso y descuenta del stock de vitrina.", table_cell)],
        [Paragraph("<b>5. Expirado / Rechazado</b>", table_cell_bold), Paragraph("Pasan 45 min sin WhatsApp o se detecta broma.", table_cell), Paragraph("<font color='#DC2626'><b>NO</b> (Cancelado)</font>", table_cell), Paragraph("Se libera cupo y se archiva sin merma.", table_cell)],
    ]
    state_table = Table([state_headers] + state_rows, colWidths=[105, 140, 95, 164])
    state_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(state_table)

    # =========================================================================
    # PÁGINA 3: FINANZAS OCR, CLIENTES & PLAN DE HORNO
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("4. Separación de Gastos Generales vs Insumos en OCR y Gráficas", h1))
    story.append(Paragraph(
        "Al capturar tickets con la cámara o subirlos a la app, se introduce una bifurcación inicial para no distorsionar los costos de repostería con egresos operativos:",
        body
    ))
    story.append(Paragraph("• <b>Modal de Selección al Escanear:</b> La app consulta de inmediato: <i>[ Insumos de Repostería ]</i> o <i>[ Gasto General / Operativo ]</i>.", bullet))
    story.append(Paragraph("• <b>Ruta Insumos:</b> Extrae gramos y costos, actualiza el valor de las recetas y notifica variaciones de precios por inflación.", bullet))
    story.append(Paragraph("• <b>Ruta Gastos Generales:</b> Digitaliza comprobantes de servicios (Luz, Gas, Renta, Empaques, Publicidad, Limpieza). Guarda la imagen fiscal sin alterar el inventario de cocina.", bullet))
    story.append(Paragraph("• <b>Gráficas en 3 Ejes Financieros Claros:</b><br/>"
                           "  1. <b>Gastos Generales:</b> Costos fijos del local o taller.<br/>"
                           "  2. <b>Total Insumos de Galletas:</b> Costo variable directo de producción (COGS).<br/>"
                           "  3. <b>Total Consolidado:</b> Erogación acumulada para el balance neto de utilidad del negocio.", bullet))
    story.append(Spacer(1, 6))

    story.append(Paragraph("5. Directorio y Eliminación Segura de Clientes Guardados", h1))
    story.append(Paragraph(
        "Para mantener el directorio ágil y libre de contactos erróneos:",
        body
    ))
    story.append(Paragraph("• Directorio visual en la app accesible con el botón <i>'Clientes'</i> en la cabecera de Pedidos con buscador por nombre y teléfono.", bullet))
    story.append(Paragraph("• Botón de borrado individual con alerta de confirmación previa: <i>'¿Eliminar cliente? Ya no aparecerá en sugerencias rápidas, pero su historial de ventas se preservará'</i>.", bullet))
    story.append(Paragraph("• Endpoint de eliminación en backend: <code>DELETE /api/customers/{id}</code> sincronizado en tiempo real.", bullet))
    story.append(Spacer(1, 6))

    story.append(Paragraph("6. Plan de Horno Consolidado ('Plan del Día')", h1))
    story.append(Paragraph(
        "Calculadora matemática que sincroniza en tiempo real los pedidos confirmados del día contra el inventario disponible:",
        body
    ))
    story.append(Paragraph("• <b>Balance Neto de Producción:</b> (Galletas pedidas para hoy) - (Galletas listas en stock) = <b>Galletas a hornear hoy</b>.", bullet))
    story.append(Paragraph("• <b>Conversión Automática a Tandas:</b> Si se requieren 16 galletas y la tanda rinde 10, calcula: <i>'Hornear 2 tandas (20 piezas): 16 para pedidos programados + 4 sobrantes para venta de mostrador'</i>.", bullet))
    story.append(Paragraph("• <b>Checklist Operativo de Pesaje:</b> Muestra los gramos exactos de mantequilla a ablandar, huevos a templar y harina a cernir antes de encender el horno, ahorrando tiempo y gas.", bullet))
    story.append(Spacer(1, 8))

    # Tarjeta de ejemplo de Plan de Horno
    baking_card_data = [
        [Paragraph("<b>EJEMPLO PRÁCTICO: RESUMEN DEL PLAN DE HORNO MATUTINO</b>", ParagraphStyle('W2', parent=body_bold, textColor=PRIMARY))],
        [Paragraph(
            "• <b>Chispas Clásicas:</b> 22 pedidos confirmados - 6 en vitrina = <b>16 pzas faltantes</b> ➔ <b>Hornear 2 Tandas (20 pzas)</b>. Sobran 4 para mostrador.<br/>"
            "• <b>Oreo Especial:</b> 12 pedidos confirmados - 2 en vitrina = <b>10 pzas faltantes</b> ➔ <b>Hornear 1 Tanda (10 pzas)</b>. Cubre el 100% exacto.<br/>"
            "• <b>Insumos Totales a Descongelar/Pesar:</b> 450 g mantequilla, 900 g harina, 3 huevos enteros, 30 galletas Oreo troceadas.",
            body
        )]
    ]
    baking_card_table = Table(baking_card_data, colWidths=[504])
    baking_card_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1.2, GOLD),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(baking_card_table)

    # =========================================================================
    # PÁGINA 4: ACTUALIZACIONES DESDE GITHUB EN LA APP & HOJA DE RUTA
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("7. Plan Maestro de Actualizaciones: Todo In-App desde GitHub", h1))
    story.append(Paragraph(
        "Para erradicar por completo la necesidad de pasar APKs por WhatsApp, cables o Google Drive, se implementa el <b>Auto-Actualizador In-App conectado a GitHub Releases</b> (Repositorio oficial: <code>github.com/Leija05/AdmMoney</code>):",
        body
    ))

    # Tabla comparativa de actualización con GitHub
    updates_headers = [
        Paragraph("<b>Paso del Flujo</b>", table_cell_bold),
        Paragraph("<b>Operación en GitHub / Backend</b>", table_cell_bold),
        Paragraph("<b>Experiencia en la App Móvil</b>", table_cell_bold),
        Paragraph("<b>Automatización</b>", table_cell_bold)
    ]
    updates_rows = [
        [
            Paragraph("<b>1. Publicación de Release</b>", table_cell_bold),
            Paragraph("En <code>Leija05/AdmMoney/releases</code> se crea un nuevo release con tag de versión (ej. <code>v1.2.0</code>) y se adjunta el archivo <code>.apk</code>.", table_cell),
            Paragraph("El desarrollador publica en 1 clic en GitHub con notas del parche y mejoras incluidas.", table_cell),
            Paragraph("<b>100% en GitHub</b><br/>(Sin servidores extra)", table_cell)
        ],
        [
            Paragraph("<b>2. Consulta y Detección</b>", table_cell_bold),
            Paragraph("La app consulta el endpoint público:<br/><code>GET /repos/Leija05/AdmMoney/releases/latest</code>.<br/>Compara versión remota vs instalada.", table_cell),
            Paragraph("Al abrir Ajustes o presionar <i>'Buscar Actualizaciones'</i>, la app detecta si hay nueva versión de inmediato.", table_cell),
            Paragraph("<b>API REST Oficial</b><br/>(Segura y pública)", table_cell)
        ],
        [
            Paragraph("<b>3. Descarga con Progreso</b>", table_cell_bold),
            Paragraph("La app inicia descarga resumable con <code>FileSystem.createDownloadResumable</code> guardando en la caché del dispositivo.", table_cell),
            Paragraph("Modal elegante muestra las notas de GitHub y una barra de progreso en vivo (% y MB descargados).", table_cell),
            Paragraph("<b>Descarga directa</b><br/>(Alta velocidad CDN)", table_cell)
        ],
        [
            Paragraph("<b>4. Instalación en 1 Toque</b>", table_cell_bold),
            Paragraph("Se genera content URI y se invoca Intent nativo de Android: <code>application/vnd.android.package-archive</code>.", table_cell),
            Paragraph("Se abre el diálogo nativo de Android: <i>'¿Deseas instalar esta actualización?'</i>. El usuario pulsa Instalar y listo.", table_cell),
            Paragraph("<b>Cero cables ni WhatsApp</b><br/>Todo dentro de la app", table_cell)
        ],
    ]
    updates_table = Table([updates_headers] + updates_rows, colWidths=[105, 145, 160, 94])
    updates_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), GITHUB_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(updates_table)
    story.append(Spacer(1, 8))

    # Pasos de despliegue con GitHub
    story.append(Paragraph("Cómo Publicar y Recibir Actualizaciones sin Fricción", h2))
    story.append(Paragraph(
        "1. <b>El programador:</b> Compila el APK final y lo sube como archivo adjunto a un Release de GitHub en <code>github.com/Leija05/AdmMoney/releases</code>.<br/>"
        "2. <b>El usuario:</b> En la app móvil, va a <b>Ajustes ➔ Actualizaciones desde GitHub</b> y pulsa <b>[ Buscar Actualizaciones ]</b> (o la app lo notifica automáticamente).<br/>"
        "3. <b>Un solo toque:</b> Aparece la ventana con las mejoras agregadas, pulsa <b>[ Actualizar Ahora ]</b>, se descarga la barra de progreso y Android actualiza la app.<br/>"
        "4. <b>Resultado:</b> Cero descargas manuales, cero enlaces sueltos en WhatsApp y la app se mantiene siempre al día desde GitHub.",
        body
    ))
    story.append(Spacer(1, 10))

    # Sección 8: Roadmap
    story.append(Paragraph("8. Hoja de Ruta de Implementación Técnica por Fases", h1))
    roadmap_data = [
        [Paragraph("<b>Fase</b>", table_cell_bold), Paragraph("<b>Módulos y Entregables Clave</b>", table_cell_bold), Paragraph("<b>Beneficio Directo</b>", table_cell_bold)],
        [
            Paragraph("<b>Fase 1: Finanzas & OCR</b>", table_cell),
            Paragraph("• Modal Insumos vs Gastos Generales en OCR.<br/>• Gráficas financieras con 3 ejes diferenciados.<br/>• Módulo de directorio y eliminación de clientes.", table_cell),
            Paragraph("Control de egresos limpio sin mezclar insumos de cocina con gastos fijos.", table_cell)
        ],
        [
            Paragraph("<b>Fase 2: Costos & Stock</b>", table_cell),
            Paragraph("• Receta fija con costo real de $9.67/galleta.<br/>• Inventario de galletas listas independiente.<br/>• Registro de tandas y descuento por venta.", table_cell),
            Paragraph("Saber cuántas galletas listas hay y cuánto ganas exactamente por pieza.", table_cell)
        ],
        [
            Paragraph("<b>Fase 3: Portal Web QR</b>", table_cell),
            Paragraph("• Menú web móvil para clientes.<br/>• Redirección a la Línea de WhatsApp activa.<br/>• Estrategia anti-mermas (45 min auto-expiración y rate limit sin anticipo).", table_cell),
            Paragraph("Clientes piden escaneando el empaque y la orden llega lista a WhatsApp sin merma.", table_cell)
        ],
        [
            Paragraph("<b>Fase 4: Horno & Updates</b>", table_cell),
            Paragraph("• Calculadora del Plan de Horno del día.<br/>• Auto-actualizador In-App desde GitHub Releases.", table_cell),
            Paragraph("Cero merma al hornear y la app se actualiza sola desde GitHub en 1 toque.", table_cell)
        ],
    ]
    roadmap_table = Table(roadmap_data, colWidths=[90, 240, 174])
    roadmap_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_CARD]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(roadmap_table)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generado exitosamente en: {output_path}")

if __name__ == '__main__':
    output_file = os.path.join(os.path.dirname(__file__), "..", "Plan_Maestro_Implementacion_Lucky_Cookies.pdf")
    output_file = os.path.abspath(output_file)
    create_pdf(output_file)
