import io
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from typing import Dict, Any

def clean_unicode(text: Any) -> str:
  """
  ReportLab standard fonts (Helvetica, Times, Courier) only support WinAnsiEncoding.
  Replace common unicode symbols with standard ASCII equivalents.
  """
  if text is None:
    return ""
  text = str(text)
  if not text:
    return ""
  text = text.replace("\u2013", "-").replace("\u2014", "-") # Em/en dash
  text = text.replace("\u2018", "'").replace("\u2019", "'") # Smart quotes
  text = text.replace("\u201c", '"').replace("\u201d", '"')
  text = text.replace("\u2022", "*") # Bullet point
  return re.sub(r'[^\x00-\x7F]+', ' ', text)

def build_pdf_story(resume_data: Dict[str, Any], template: str = "harvard") -> bytes:
  """
  Generates a high-quality PDF matching the chosen ATS template layout.
  Supported: harvard, jakes, stanford, microsoft, reactive, novoresume, flowcv, indeed
  """
  pdf_buffer = io.BytesIO()
  
  # Page margins selection
  margin = 40
  if template in ["stanford", "flowcv"]:
    margin = 45
  elif template in ["jakes", "indeed"]:
    margin = 35

  doc = SimpleDocTemplate(
    pdf_buffer,
    pagesize=letter,
    rightMargin=margin, leftMargin=margin,
    topMargin=margin, bottomMargin=margin
  )
  
  styles = getSampleStyleSheet()
  
  # ── Styling configuration mapping ──
  primary_color = colors.HexColor("#111111")
  secondary_color = colors.HexColor("#4B5563")
  divider_color = colors.HexColor("#CBD5E1")
  font_family = "Helvetica"
  title_font = "Helvetica-Bold"
  header_align = TA_CENTER

  if template == "harvard":
    title_font = "Times-Bold"
    font_family = "Times-Roman"
    secondary_color = colors.HexColor("#334155")
  elif template == "jakes":
    primary_color = colors.HexColor("#000000")
    secondary_color = colors.HexColor("#64748B")
  elif template == "stanford":
    primary_color = colors.HexColor("#990000") # Crimson
    secondary_color = colors.HexColor("#475569")
    title_font = "Times-Bold"
    font_family = "Times-Roman"
  elif template == "microsoft":
    primary_color = colors.HexColor("#000000")
    secondary_color = colors.HexColor("#52525B")
    header_align = TA_LEFT
  elif template == "reactive":
    primary_color = colors.HexColor("#4F46E5") # Indigo
    secondary_color = colors.HexColor("#4B5563")
    header_align = TA_LEFT
  elif template == "novoresume":
    primary_color = colors.HexColor("#2C3E50")
    secondary_color = colors.HexColor("#3498DB")
  elif template == "flowcv":
    primary_color = colors.HexColor("#1A202C")
    secondary_color = colors.HexColor("#718096")
    header_align = TA_LEFT
  elif template == "indeed":
    primary_color = colors.HexColor("#333333")
    secondary_color = colors.HexColor("#666666")

  # ── Custom Paragraph Styles ──
  title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontName=title_font,
    fontSize=18,
    leading=22,
    textColor=primary_color,
    alignment=header_align,
    spaceAfter=4
  )
  
  subtitle_style = ParagraphStyle(
    'DocSubtitle',
    parent=styles['Normal'],
    fontName=font_family,
    fontSize=9.5,
    leading=12,
    textColor=secondary_color,
    alignment=header_align,
    spaceAfter=12
  )
  
  h1_style = ParagraphStyle(
    'DocH1',
    parent=styles['Heading2'],
    fontName=title_font,
    fontSize=11,
    leading=14,
    textColor=primary_color,
    spaceBefore=10,
    spaceAfter=4,
    keepWithNext=True
  )
  
  body_style = ParagraphStyle(
    'DocBody',
    parent=styles['Normal'],
    fontName=font_family,
    fontSize=9.5,
    leading=12.5,
    textColor=colors.HexColor("#333333"),
    spaceAfter=4
  )
  
  bullet_style = ParagraphStyle(
    'DocBullet',
    parent=body_style,
    leftIndent=15,
    firstLineIndent=-10,
    spaceAfter=3
  )

  # 1. Personal Header Info
  p_info = resume_data.get("personal_info", {})
  name = clean_unicode(p_info.get("name", "Candidate Name"))
  email = clean_unicode(p_info.get("email", ""))
  phone = clean_unicode(p_info.get("phone", ""))
  location = clean_unicode(p_info.get("location", ""))
  student = resume_data.get("student")
  
  # Clean AI/Parsed prefixes from name to show the actual candidate name
  clean_name = name.replace("AI Parsed - ", "").replace("AI Diagnostic - ", "").replace("AI Optimized - ", "").strip()
  if not clean_name or clean_name.lower() == "resume":
    clean_name = getattr(student, "student_name", None) or "Candidate Name"
  
  email_val = email or getattr(student, "personal_email", "") or "student@bimba.ai"
  phone_val = phone or getattr(student, "phone", "") or "9876543210"
  loc_val = location or getattr(student, "address", "") or "Mangalore, India"
  
  contact_parts = [email_val, phone_val, loc_val]
  contact_str = "  |  ".join([part for part in contact_parts if part])
  
  story = []
  story.append(Paragraph(clean_name, title_style))
  story.append(Paragraph(contact_str, subtitle_style))

  # Divider border line underneath header
  if template in ["harvard", "stanford", "microsoft", "reactive"]:
    rule_table = Table([[""]], colWidths=[532], rowHeights=[2])
    rule_table.setStyle(TableStyle([
      ('BACKGROUND', (0,0), (-1,-1), primary_color),
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
    story.append(Spacer(1, 4))

  # 3. Education
  education = resume_data.get("education", [])
  if education:
    story.append(Paragraph("EDUCATION", h1_style))
    for edu in education:
      degree = clean_unicode(edu.get("degree", "Degree"))
      school = clean_unicode(edu.get("institution", "University"))
      year = clean_unicode(edu.get("year") or edu.get("passing_year") or "")
      cgpa = clean_unicode(edu.get("cgpa") or edu.get("percentage") or "")
      achievements = clean_unicode(edu.get("achievements") or "")
      
      edu_left = f"<b>{school}</b><br/>{degree}"
      if cgpa:
        edu_left += f" — CGPA: {cgpa}"
      if achievements:
        edu_left += f" | {achievements}"
        
      edu_table = Table(
        [[Paragraph(edu_left, body_style), Paragraph(str(year), ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
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

  # 4. Work Experience
  experience = resume_data.get("experience", [])
  if experience:
    story.append(Paragraph("WORK EXPERIENCE", h1_style))
    for exp in experience:
      job_title = clean_unicode(exp.get("position", "Developer"))
      company = clean_unicode(exp.get("company", "Company"))
      duration = clean_unicode(exp.get("duration", ""))
      
      exp_header = f"<b>{job_title}</b> — {company}"
      
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
        bullets = [b.strip() for b in re.split(r'[\*\u2022•\n]', desc) if b.strip()]
        if len(bullets) > 1:
          for bullet in bullets:
            exp_block.append(Paragraph(f"• {clean_unicode(bullet)}", bullet_style))
        else:
          exp_block.append(Paragraph(clean_unicode(desc), body_style))
      
      story.append(KeepTogether(exp_block))
      story.append(Spacer(1, 4))

  # 5. Projects
  projects = resume_data.get("projects", [])
  if projects:
    story.append(Paragraph("ACADEMIC & PERSONAL PROJECTS", h1_style))
    for proj in projects:
      title = clean_unicode(proj.get("title", "Project Title"))
      tech = clean_unicode(proj.get("technologies", ""))
      desc = clean_unicode(proj.get("description", ""))
      duration = clean_unicode(proj.get("duration") or "")
      
      proj_header = f"<b>{title}</b>" + (f" ({tech})" if tech else "")
      
      proj_table = Table(
        [[Paragraph(proj_header, body_style), Paragraph(duration, ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
        colWidths=[420, 112]
      )
      proj_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
      ]))
      
      proj_block = [
        proj_table,
        Paragraph(desc, body_style) if desc else Spacer(1, 1)
      ]
      story.append(KeepTogether(proj_block))
      story.append(Spacer(1, 4))

  # 6. Skills
  skills = resume_data.get("skills", [])
  if skills:
    story.append(Paragraph("TECHNICAL SKILLS", h1_style))
    if isinstance(skills, list) and skills and isinstance(skills[0], dict):
      # Group by category
      groups = {}
      for s in skills:
        cat = s.get("category") or "General"
        name = s.get("name") or ""
        lvl = s.get("level")
        skill_str = name + (f" (Lvl {lvl})" if lvl else "")
        if cat not in groups:
          groups[cat] = []
        groups[cat].append(skill_str)
      
      for cat, items in groups.items():
        cat_str = f"<b>{clean_unicode(cat)}:</b> {clean_unicode(', '.join(items))}"
        story.append(Paragraph(cat_str, body_style))
    else:
      skills_str = ", ".join([clean_unicode(s) for s in skills]) if isinstance(skills, list) else clean_unicode(skills)
      story.append(Paragraph(skills_str, body_style))
    story.append(Spacer(1, 4))

  # 7. Achievements & Extracurriculars
  import json
  achievements_raw = resume_data.get("achievements") or resume_data.get("achievements_list") or {}
  if isinstance(achievements_raw, str) and achievements_raw:
    try:
      achievements_raw = json.loads(achievements_raw)
    except:
      achievements_raw = {}
      
  if achievements_raw and isinstance(achievements_raw, dict):
    ach_items = {k.replace("_", " ").capitalize(): v for k, v in achievements_raw.items() if v}
    if ach_items:
      story.append(Paragraph("ACHIEVEMENTS & EXTRACURRICULARS", h1_style))
      for k, v in ach_items.items():
        story.append(Paragraph(f"<b>{k}:</b> {clean_unicode(v)}", body_style))
      story.append(Spacer(1, 4))

  doc.build(story)
  pdf_bytes = pdf_buffer.getvalue()
  pdf_buffer.close()
  return pdf_bytes
