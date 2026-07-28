import io
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from typing import Dict, Any

def clean_unicode(text: str) -> str:
    """
    ReportLab standard fonts (Helvetica, Times, Courier) only support WinAnsiEncoding.
    Replace common unicode symbols with standard ASCII equivalents.
    """
    if not text:
        return ""
    text = text.replace("\u2013", "-").replace("\u2014", "-") # Em/en dash
    text = text.replace("\u2018", "'").replace("\u2019", "'") # Smart quotes
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u2022", "*") # Bullet point
    # Remove other non-ASCII characters
    return re.sub(r'[^\x00-\x7F]+', ' ', text)

def build_pdf_story(resume_data: Dict[str, Any], template: str = "ats_classic") -> bytes:
    """
    Generates a PDF using ReportLab flowables.
    Supported templates: ats_classic, modern_dev, minimal_pro, creative_portfolio.
    """
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # ── Color Palette Definitions ──
    primary_color = colors.HexColor("#1A1A1A")
    secondary_color = colors.HexColor("#4B5563")
    accent_color = colors.HexColor("#10B981") # Bimba Green
    text_color = colors.HexColor("#1F2937")
    bg_color = colors.white
    
    if template == "modern_dev":
        primary_color = colors.HexColor("#065F46") # Emerald-800
        secondary_color = colors.HexColor("#10B981") # Bimba Green
    elif template == "minimal_pro":
        primary_color = colors.HexColor("#1E3A8A") # Navy Blue
        secondary_color = colors.HexColor("#4B5563")
    elif template == "creative_portfolio":
        primary_color = colors.HexColor("#6D28D9") # Violet
        secondary_color = colors.HexColor("#EC4899") # Pink
    
    # ── Custom Paragraph Styles ──
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=TA_LEFT if template != "ats_classic" else TA_CENTER,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=secondary_color,
        alignment=TA_LEFT if template != "ats_classic" else TA_CENTER,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'DocH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=text_color,
        spaceAfter=6
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=text_color,
        spaceAfter=2
    )

    story = []

    # 1. Header (Personal Info)
    p_info = resume_data.get("personal_info", {})
    name = clean_unicode(p_info.get("name", "Candidate Name"))
    email = clean_unicode(p_info.get("email", ""))
    phone = clean_unicode(p_info.get("phone", ""))
    location = clean_unicode(p_info.get("location", ""))
    
    contact_parts = [email, phone, location]
    contact_str = "  |  ".join([part for part in contact_parts if part])
    
    story.append(Paragraph(name, title_style))
    story.append(Paragraph(contact_str, subtitle_style))

    # Add a horizontal rule for non-classic templates
    if template != "ats_classic":
        rule_table = Table([[""]], colWidths=[532], rowHeights=[2])
        rule_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), secondary_color),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(rule_table)
        story.append(Spacer(1, 10))

    # 2. Professional Summary
    summary_text = clean_unicode(resume_data.get("summary", ""))
    if summary_text:
        story.append(Paragraph("PROFESSIONAL SUMMARY", h1_style))
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 6))

    # 3. Skills
    skills = resume_data.get("skills", [])
    if skills:
        story.append(Paragraph("TECHNICAL SKILLS", h1_style))
        skills_str = ", ".join([clean_unicode(s) for s in skills])
        story.append(Paragraph(skills_str, body_style))
        story.append(Spacer(1, 6))

    # 4. Work Experience
    experience = resume_data.get("experience", [])
    if experience:
        story.append(Paragraph("PROFESSIONAL EXPERIENCE", h1_style))
        for exp in experience:
            job_title = clean_unicode(exp.get("position", "Developer"))
            company = clean_unicode(exp.get("company", "Company"))
            duration = clean_unicode(exp.get("duration", ""))
            
            exp_header = f"<b>{job_title}</b> — {company}"
            
            # Use table to align header and duration
            exp_header_table = Table(
                [[Paragraph(exp_header, body_style), Paragraph(duration, ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
                colWidths=[380, 152]
            )
            exp_header_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                ('TOPPADDING', (0,0), (-1,-1), 0),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            
            exp_block = [exp_header_table]
            
            desc = exp.get("description", "")
            if desc:
                # If description contains bullet characters, split them
                bullets = [b.strip() for b in re.split(r'[\*\u2022•]', desc) if b.strip()]
                if len(bullets) > 1:
                    for bullet in bullets:
                        exp_block.append(Paragraph(f"• {clean_unicode(bullet)}", bullet_style))
                else:
                    exp_block.append(Paragraph(clean_unicode(desc), body_style))
            
            story.append(KeepTogether(exp_block))
            story.append(Spacer(1, 5))

    # 5. Projects
    projects = resume_data.get("projects", [])
    if projects:
        story.append(Paragraph("PROJECTS", h1_style))
        for proj in projects:
            title = clean_unicode(proj.get("title", "Project Title"))
            tech = clean_unicode(proj.get("technologies", ""))
            desc = clean_unicode(proj.get("description", ""))
            
            proj_header = f"<b>{title}</b>" + (f" ({tech})" if tech else "")
            
            proj_block = [
                Paragraph(proj_header, body_style),
                Paragraph(desc, body_style) if desc else Spacer(1, 1)
            ]
            story.append(KeepTogether(proj_block))
            story.append(Spacer(1, 5))

    # 6. Education
    education = resume_data.get("education", [])
    if education:
        story.append(Paragraph("EDUCATION", h1_style))
        for edu in education:
            degree = clean_unicode(edu.get("degree", "Degree"))
            school = clean_unicode(edu.get("institution", "University"))
            year = clean_unicode(edu.get("year", ""))
            
            edu_str = f"<b>{degree}</b> — {school}"
            
            edu_table = Table(
                [[Paragraph(edu_str, body_style), Paragraph(year, ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
                colWidths=[420, 112]
            )
            edu_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                ('TOPPADDING', (0,0), (-1,-1), 0),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(KeepTogether([edu_table]))
            story.append(Spacer(1, 4))

    doc.build(story)
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()
    return pdf_bytes
