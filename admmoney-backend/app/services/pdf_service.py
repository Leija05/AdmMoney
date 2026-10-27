import os
from io import BytesIO
from typing import Dict, Any, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import portrait
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")
LOGO_PATH = os.path.join(ASSETS_DIR, "lucky_cookies_logo.png")

def create_sale_ticket_pdf(sale: Dict[str, Any], note: Optional[str] = None) -> bytes:
    buffer = BytesIO()
    
    # 80mm width standard thermal / luxury ticket
    page_width = 80 * mm
    page_height = 210 * mm
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(page_width, page_height),
        leftMargin=5 * mm,
        rightMargin=5 * mm,
        topMargin=8 * mm,
        bottomMargin=8 * mm
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TicketTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        alignment=1, # Center
        textColor=colors.HexColor('#1E293B')
    )
    
    sub_style = ParagraphStyle(
        'TicketSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor('#64748B')
    )
    
    meta_style = ParagraphStyle(
        'TicketMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )
    
    meta_bold = ParagraphStyle(
        'TicketMetaBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    
    item_title = ParagraphStyle(
        'ItemTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    
    story = []
    
    # Logo
    if os.path.exists(LOGO_PATH):
        try:
            img = Image(LOGO_PATH, width=28*mm, height=28*mm)
            img.hAlign = 'CENTER'
            story.append(img)
            story.append(Spacer(1, 2*mm))
        except Exception:
            pass
            
    # Business Name & Subtitle
    story.append(Paragraph("Lucky Cookies<br/>Galletas y Postres", title_style))
    story.append(Paragraph("Ticket Oficial de Venta", sub_style))
    story.append(Spacer(1, 3*mm))
    
    # Divider table
    divider_data = [["-------------------------------------------------"]]
    div_table = Table(divider_data, colWidths=[70*mm])
    div_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#CBD5E1')),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('TOPPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    # Metadata info
    meta_data = [
        [Paragraph("Ticket #:", meta_style), Paragraph(f"<b>#{sale.get('id', 1)}</b>", meta_bold)],
        [Paragraph("Fecha:", meta_style), Paragraph(str(sale.get('sale_date', '')), meta_style)],
        [Paragraph("Cliente:", meta_style), Paragraph(str(sale.get('customer_name', 'Cliente Mostrador')), meta_bold)],
        [Paragraph("Método de Pago:", meta_style), Paragraph(str(sale.get('payment_method', 'Efectivo')), meta_style)],
    ]
    meta_table = Table(meta_data, colWidths=[24*mm, 46*mm])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 2*mm))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    # Product line
    qty = sale.get('quantity', 1)
    name = sale.get('cookie_name', 'Galleta Artesanal')
    unit_price = float(sale.get('unit_price', 0.0))
    total_rev = float(sale.get('total_revenue', 0.0))
    
    prod_data = [
        [Paragraph(f"{qty}x {name}", item_title), Paragraph(f"${total_rev:.2f}", meta_bold)],
        [Paragraph(f"Precio Unitario: ${unit_price:.2f} MXN", sub_style), Paragraph("", sub_style)]
    ]
    prod_table = Table(prod_data, colWidths=[50*mm, 20*mm])
    prod_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(prod_table)
    
    if sale.get('notes'):
        story.append(Spacer(1, 1.5*mm))
        note_p = Paragraph(f"<i>Detalles: {sale.get('notes')}</i>", sub_style)
        story.append(note_p)
        
    story.append(Spacer(1, 2*mm))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    # Total row
    total_style = ParagraphStyle(
        'TicketTotal',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        alignment=2, # Right
        textColor=colors.HexColor('#0F172A')
    )
    total_data = [
        [Paragraph("TOTAL:", ParagraphStyle('TL', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#0F172A'))),
         Paragraph(f"${total_rev:.2f} MXN", total_style)]
    ]
    tot_table = Table(total_data, colWidths=[30*mm, 40*mm])
    tot_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(tot_table)
    
    if note and note.strip():
        story.append(Spacer(1, 3*mm))
        msg_box = Paragraph(f"<b>Nota:</b> {note.strip()}", meta_style)
        story.append(msg_box)
        
    story.append(Spacer(1, 4*mm))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    footer_p1 = Paragraph("¡Gracias por endulzar tu día con nosotros!", sub_style)
    footer_p2 = Paragraph("Lucky Cookies • Galletas y Postres", ParagraphStyle('F2', parent=sub_style, fontName='Helvetica-Bold', fontSize=7.5))
    story.append(footer_p1)
    story.append(Spacer(1, 1*mm))
    story.append(footer_p2)
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def create_order_ticket_pdf(order: Dict[str, Any], note: Optional[str] = None) -> bytes:
    buffer = BytesIO()
    page_width = 80 * mm
    page_height = 240 * mm
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(page_width, page_height),
        leftMargin=5 * mm,
        rightMargin=5 * mm,
        topMargin=8 * mm,
        bottomMargin=8 * mm
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TicketTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#1E293B')
    )
    sub_style = ParagraphStyle(
        'TicketSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor('#64748B')
    )
    meta_style = ParagraphStyle(
        'TicketMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )
    meta_bold = ParagraphStyle(
        'TicketMetaBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    item_title = ParagraphStyle(
        'ItemTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    
    story = []
    
    if os.path.exists(LOGO_PATH):
        try:
            img = Image(LOGO_PATH, width=28*mm, height=28*mm)
            img.hAlign = 'CENTER'
            story.append(img)
            story.append(Spacer(1, 2*mm))
        except Exception:
            pass
            
    story.append(Paragraph("Lucky Cookies<br/>Galletas y Postres", title_style))
    story.append(Paragraph("Comprobante de Pedido Programado", sub_style))
    story.append(Spacer(1, 3*mm))
    
    divider_data = [["-------------------------------------------------"]]
    div_table = Table(divider_data, colWidths=[70*mm])
    div_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#CBD5E1')),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('TOPPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    meta_data = [
        [Paragraph("Pedido #:", meta_style), Paragraph(f"<b>#{order.get('id', 1)}</b>", meta_bold)],
        [Paragraph("Cliente:", meta_style), Paragraph(str(order.get('customer_name', 'Cliente')), meta_bold)],
        [Paragraph("Teléfono:", meta_style), Paragraph(str(order.get('customer_phone', '-')), meta_style)],
        [Paragraph("Entrega:", meta_style), Paragraph(str(order.get('delivery_date', '')), meta_bold)],
        [Paragraph("Estado:", meta_style), Paragraph(str(order.get('status', 'Pendiente')), meta_style)],
        [Paragraph("Pago:", meta_style), Paragraph(f"{order.get('payment_method', 'Transferencia')} ({order.get('payment_status', 'Pendiente')})", meta_style)],
    ]
    meta_table = Table(meta_data, colWidths=[24*mm, 46*mm])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 2*mm))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    # Items
    items = order.get('items', [])
    for it in items:
        q = it.get('quantity', 1)
        pname = it.get('product_name', 'Galleta Artesanal')
        subt = float(it.get('subtotal', 0.0))
        uprice = float(it.get('unit_price', 0.0))
        
        row_data = [
            [Paragraph(f"{q}x {pname}", item_title), Paragraph(f"${subt:.2f}", meta_bold)],
            [Paragraph(f"${uprice:.2f} c/u", sub_style), Paragraph("", sub_style)]
        ]
        t = Table(row_data, colWidths=[50*mm, 20*mm])
        t.setStyle(TableStyle([
            ('ALIGN', (1,0), (1,-1), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ]))
        story.append(t)
        story.append(Spacer(1, 1*mm))
        
    story.append(Spacer(1, 2*mm))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    total_amt = float(order.get('total_amount', 0.0))
    total_data = [
        [Paragraph("TOTAL:", ParagraphStyle('TL', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#0F172A'))),
         Paragraph(f"${total_amt:.2f} MXN", ParagraphStyle('TR', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, alignment=2, textColor=colors.HexColor('#0F172A')))]
    ]
    tot_table = Table(total_data, colWidths=[30*mm, 40*mm])
    tot_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(tot_table)
    
    if note and note.strip():
        story.append(Spacer(1, 3*mm))
        msg_box = Paragraph(f"<b>Nota:</b> {note.strip()}", meta_style)
        story.append(msg_box)
    elif order.get('notes'):
        story.append(Spacer(1, 3*mm))
        msg_box = Paragraph(f"<b>Detalles:</b> {order.get('notes')}", sub_style)
        story.append(msg_box)
        
    story.append(Spacer(1, 4*mm))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    footer_p1 = Paragraph("¡Gracias por tu pedido y preferencia!", sub_style)
    footer_p2 = Paragraph("Lucky Cookies • Galletas y Postres", ParagraphStyle('F2', parent=sub_style, fontName='Helvetica-Bold', fontSize=7.5))
    story.append(footer_p1)
    story.append(Spacer(1, 1*mm))
    story.append(footer_p2)
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def create_daily_summary_pdf(summary: Dict[str, Any], business_name: str = "Lucky Cookies") -> bytes:
    buffer = BytesIO()
    page_width = 80 * mm
    page_height = 260 * mm
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(page_width, page_height),
        leftMargin=5 * mm,
        rightMargin=5 * mm,
        topMargin=8 * mm,
        bottomMargin=8 * mm
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DSTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#0F172A')
    )
    
    sub_style = ParagraphStyle(
        'DSSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor('#475569')
    )
    
    meta_style = ParagraphStyle(
        'DSMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )
    
    meta_bold = ParagraphStyle(
        'DSMetaBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    
    header_section = ParagraphStyle(
        'DSSectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    
    item_title = ParagraphStyle(
        'DSItemTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )
    
    story = []
    
    if os.path.exists(LOGO_PATH):
        try:
            img = Image(LOGO_PATH, width=24*mm, height=24*mm)
            img.hAlign = 'CENTER'
            story.append(img)
            story.append(Spacer(1, 2*mm))
        except Exception:
            pass
            
    bname = business_name or "Lucky Cookies"
    story.append(Paragraph(bname.upper(), title_style))
    story.append(Paragraph("RESUMEN DEL DÍA", sub_style))
    story.append(Spacer(1, 2*mm))
    
    date_val = summary.get("date", "")
    story.append(Paragraph(f"Fecha: {date_val}", ParagraphStyle('DSDate', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=1, textColor=colors.HexColor('#64748B'))))
    story.append(Spacer(1, 2.5*mm))
    
    div_table = Table([["-------------------------------------------------"]], colWidths=[70*mm])
    div_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#CBD5E1')),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    rev = float(summary.get("total_revenue", 0.0))
    net_prof = float(summary.get("net_profit", 0.0))
    margin_pct = float(summary.get("profit_margin_pct", 0.0))
    units_sold = int(summary.get("total_units_sold", 0))
    sales_cnt = int(summary.get("sales_count", 0))
    avg_ticket = float(summary.get("average_ticket", 0.0))
    
    metrics_data = [
        [Paragraph("Ventas Totales:", meta_style), Paragraph(f"${rev:.2f} MXN", meta_bold)],
        [Paragraph("Ganancia Neta:", meta_style), Paragraph(f"${net_prof:.2f} MXN", meta_bold)],
        [Paragraph("Margen de Ganancia:", meta_style), Paragraph(f"{margin_pct:.1f}%", meta_bold)],
        [Paragraph("Piezas Vendidas:", meta_style), Paragraph(f"{units_sold} piezas", meta_bold)],
        [Paragraph("Tickets Cobrados:", meta_style), Paragraph(f"{sales_cnt}", meta_bold)],
        [Paragraph("Ticket Promedio:", meta_style), Paragraph(f"${avg_ticket:.2f} MXN", meta_bold)],
    ]
    t_metrics = Table(metrics_data, colWidths=[42*mm, 28*mm])
    t_metrics.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 2.5*mm))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    story.append(Paragraph("MÉTODOS DE PAGO", header_section))
    story.append(Spacer(1, 1.5*mm))
    
    cash_val = float(summary.get("cash_total", 0.0))
    trans_val = float(summary.get("transfer_total", 0.0))
    exp_cash = float(summary.get("expenses_cash", 0.0))
    cash_bal = float(summary.get("cash_balance", cash_val - exp_cash))
    
    pay_data = [
        [Paragraph("• Efectivo:", meta_style), Paragraph(f"${cash_val:.2f}", meta_bold)],
        [Paragraph("• Transferencia:", meta_style), Paragraph(f"${trans_val:.2f}", meta_bold)],
    ]
    if exp_cash > 0:
        pay_data.append([Paragraph("• Gastos en efectivo:", meta_style), Paragraph(f"-${exp_cash:.2f}", meta_bold)])
        pay_data.append([Paragraph("• Balance en efectivo:", meta_bold), Paragraph(f"${cash_bal:.2f}", meta_bold)])
        
    t_pay = Table(pay_data, colWidths=[42*mm, 28*mm])
    t_pay.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(t_pay)
    story.append(Spacer(1, 2.5*mm))
    story.append(div_table)
    story.append(Spacer(1, 2*mm))
    
    products = summary.get("products", [])
    if products:
        story.append(Paragraph("PRODUCTOS VENDIDOS", header_section))
        story.append(Spacer(1, 1.5*mm))
        prod_rows = []
        for p in products:
            qty = p.get("quantity", 0)
            pname = p.get("name", "Galleta")
            prev = float(p.get("revenue", 0.0))
            prod_rows.append([
                Paragraph(f"{qty}x {pname}", item_title),
                Paragraph(f"${prev:.2f}", meta_bold)
            ])
        t_prods = Table(prod_rows, colWidths=[48*mm, 22*mm])
        t_prods.setStyle(TableStyle([
            ('ALIGN', (1,0), (1,-1), 'RIGHT'),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ]))
        story.append(t_prods)
        story.append(Spacer(1, 2*mm))
        story.append(div_table)
        story.append(Spacer(1, 2*mm))
        
    footer_text = Paragraph("Resumen generado con Adm Money", ParagraphStyle('DSFoot', parent=styles['Normal'], fontName='Helvetica', fontSize=7, alignment=1, textColor=colors.HexColor('#64748B')))
    story.append(footer_text)
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
