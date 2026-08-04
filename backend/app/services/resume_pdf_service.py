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

def build_pdf_story(resume_data: Dict[str, Any], template: str = "harvard", db: Any = None) -> bytes:
  """
  Generates a high-quality PDF matching the chosen ATS template layout.
  Supported: harvard, jakes, stanford, microsoft, reactive, novoresume, flowcv, indeed + dynamic MongoDB layouts.
  """
  custom_tpl = None
  if db is not None:
    try:
      custom_tpl = db.resume_templates.find_one({"slug": template})
    except Exception as e:
      print(f"[build_pdf_story]: Database template lookup failed: {e}")

  pdf_buffer = io.BytesIO()
  
  # Page margins selection
  margin = 40
  if custom_tpl and "page" in custom_tpl and "margin" in custom_tpl["page"]:
    try:
      margin_str = str(custom_tpl["page"]["margin"]).replace("px", "").replace("pt", "").strip()
      margin = int(float(margin_str))
    except:
      margin = 40
  elif template in ["stanford", "flowcv"]:
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

  if custom_tpl:
    # Load dynamic options
    tpl_colors = custom_tpl.get("colors") or {}
    if tpl_colors.get("primary"):
      primary_color = colors.HexColor(tpl_colors["primary"])
    if tpl_colors.get("secondary"):
      secondary_color = colors.HexColor(tpl_colors["secondary"])
    if tpl_colors.get("divider"):
      divider_color = colors.HexColor(tpl_colors["divider"])
      
    tpl_fonts = custom_tpl.get("fonts") or {}
    font_name = tpl_fonts.get("body") or "Helvetica"
    if font_name.lower() in ["times", "times new roman", "georgia", "serif"]:
      font_family = "Times-Roman"
      title_font = "Times-Bold"
    else:
      font_family = "Helvetica"
      title_font = "Helvetica-Bold"
      
    layout = custom_tpl.get("layout") or "single-column"
    if layout in ["two-column", "sidebar"]:
      header_align = TA_LEFT
  elif template == "harvard":
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
  location = clean_unicode(p_info.get("address") or p_info.get("location") or "")
  student = resume_data.get("student")
  
  # Clean AI/Parsed prefixes from name to show the actual candidate name
  clean_name = name.replace("AI Parsed - ", "").replace("AI Diagnostic - ", "").replace("AI Optimized - ", "").strip()
  if not clean_name or clean_name.lower() == "resume":
    clean_name = getattr(student, "student_name", None) or "Candidate Name"
  
  email_val = email or getattr(student, "personal_email", "") or "student@bimba.ai"
  phone_val = phone or getattr(student, "phone", "") or "9876543210"
  loc_val = location or getattr(student, "address", "") or ""
  if loc_val:
    loc_val = loc_val.replace("\n", ", ").replace("\r", "")
  
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

  # --- Section Flowable Generators ---
  def make_summary_flowables(sec):
    summary_text = clean_unicode(resume_data.get("summary", ""))
    if summary_text:
      return [
        Paragraph(sec.get("title") or "PROFESSIONAL SUMMARY", h1_style),
        Paragraph(summary_text, body_style),
        Spacer(1, 4)
      ]
    return []

  def make_education_flowables(sec):
    education = resume_data.get("education", [])
    if not education:
      return []
    flowables = [Paragraph(sec.get("title") or "EDUCATION", h1_style)]
    for edu in education:
      degree = clean_unicode(edu.get("degree", "Degree"))
      school = clean_unicode(edu.get("institution", "University"))
      year = clean_unicode(edu.get("passing_year") or edu.get("year") or "")
      cgpa = clean_unicode(edu.get("cgpa_percentage") or edu.get("cgpa") or edu.get("percentage") or "")
      achievements = clean_unicode(edu.get("achievements") or "")
      
      edu_left = f"<b>{school}</b><br/>{degree}"
      if cgpa:
        edu_left += f" — CGPA/Grade: {cgpa}"
      if achievements:
        edu_left += f" | {achievements}"
        
      edu_table = Table(
        [[Paragraph(edu_left, body_style), Paragraph(str(year), ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
        colWidths=[380, 152] if (custom_tpl and custom_tpl.get("layout") in ["two-column", "sidebar"]) else [420, 112]
      )
      edu_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
      ]))
      flowables.append(KeepTogether([edu_table]))
      flowables.append(Spacer(1, 4))
    return flowables

  def make_experience_flowables(sec):
    experience = resume_data.get("experience", [])
    if not experience:
      return []
    flowables = [Paragraph(sec.get("title") or "WORK EXPERIENCE", h1_style)]
    for exp in experience:
      job_title = clean_unicode(exp.get("position", "Developer"))
      company = clean_unicode(exp.get("company", "Company"))
      duration = clean_unicode(exp.get("duration", ""))
      
      exp_header = f"<b>{job_title}</b> — {company}"
      
      exp_header_table = Table(
        [[Paragraph(exp_header, body_style), Paragraph(duration, ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
        colWidths=[380, 152] if (custom_tpl and custom_tpl.get("layout") in ["two-column", "sidebar"]) else [420, 112]
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
      
      flowables.append(KeepTogether(exp_block))
      flowables.append(Spacer(1, 4))
    return flowables

  def make_projects_flowables(sec):
    projects = resume_data.get("projects", [])
    if not projects:
      return []
    flowables = [Paragraph(sec.get("title") or "ACADEMIC & PERSONAL PROJECTS", h1_style)]
    for proj in projects:
      title = clean_unicode(proj.get("name") or proj.get("title") or "Project Title")
      tech = clean_unicode(proj.get("tech_stack") or proj.get("technologies") or "")
      desc = clean_unicode(proj.get("description", ""))
      duration = clean_unicode(proj.get("duration") or "")
      
      proj_header = f"<b>{title}</b>" + (f" ({tech})" if tech else "")
      
      proj_table = Table(
        [[Paragraph(proj_header, body_style), Paragraph(duration, ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
        colWidths=[380, 152] if (custom_tpl and custom_tpl.get("layout") in ["two-column", "sidebar"]) else [420, 112]
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
      flowables.append(KeepTogether(proj_block))
      flowables.append(Spacer(1, 4))
    return flowables

  def make_skills_flowables(sec):
    skills = resume_data.get("skills", [])
    if not skills:
      return []
    flowables = [Paragraph(sec.get("title") or "TECHNICAL SKILLS", h1_style)]
    
    if isinstance(skills, list) and skills:
      for s in skills:
        if isinstance(s, dict):
          cat_name = s.get("name") or s.get("category") or "Skills"
          sub_skills = s.get("skills")
          if isinstance(sub_skills, list):
            skill_str = ", ".join([str(x) for x in sub_skills])
          else:
            skill_str = s.get("skill") or s.get("value") or ""
          
          if skill_str:
            cat_str = f"<b>{clean_unicode(cat_name)}:</b> {clean_unicode(skill_str)}"
            flowables.append(Paragraph(cat_str, body_style))
        else:
          skills_str = ", ".join([clean_unicode(str(x)) for x in skills])
          flowables.append(Paragraph(skills_str, body_style))
          break
    flowables.append(Spacer(1, 4))
    return flowables

  def make_certifications_flowables(sec):
    certs = resume_data.get("certifications") or []
    if not certs:
      return []
    flowables = [Paragraph(sec.get("title") or "CERTIFICATIONS AND ONLINE COURSES", h1_style)]
    for cert in certs:
      name = clean_unicode(cert.get("name") or "")
      org = clean_unicode(cert.get("organization") or "")
      date = clean_unicode(cert.get("issue_date") or cert.get("date") or "")
      desc = clean_unicode(cert.get("description") or "")
      
      left_text = f"<b>{name}</b>"
      if org:
        left_text += f" — {org}"
      if desc:
        left_text += f"<br/>{desc}"
        
      cert_table = Table(
        [[Paragraph(left_text, body_style), Paragraph(str(date), ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
        colWidths=[380, 152] if (custom_tpl and custom_tpl.get("layout") in ["two-column", "sidebar"]) else [420, 112]
      )
      cert_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
      ]))
      flowables.append(KeepTogether([cert_table]))
    flowables.append(Spacer(1, 4))
    return flowables

  def make_achievements_flowables(sec):
    ach = resume_data.get("achievements") or []
    if not ach:
      return []
    flowables = [Paragraph(sec.get("title") or "AWARDS AND ACHIEVEMENTS", h1_style)]
    for item in ach:
      if isinstance(item, dict):
        title = clean_unicode(item.get("title") or item.get("name") or "")
        desc = clean_unicode(item.get("description") or "")
        text = f"• <b>{title}:</b> {desc}" if desc else f"• {title}"
      else:
        text = f"• {clean_unicode(str(item))}"
      flowables.append(Paragraph(text, bullet_style))
    flowables.append(Spacer(1, 4))
    return flowables

  def make_hobbies_flowables(sec):
    hobbies = resume_data.get("hobbies", [])
    if not hobbies:
      return []
    flowables = [Paragraph(sec.get("title") or "HOBBIES & INTERESTS", h1_style)]
    if isinstance(hobbies, list):
      hobbies_str = ", ".join([clean_unicode(h) for h in hobbies])
    else:
      hobbies_str = clean_unicode(hobbies)
    flowables.append(Paragraph(hobbies_str, body_style))
    flowables.append(Spacer(1, 4))
    return flowables

  def make_soft_skills_flowables(sec):
    soft = resume_data.get("softSkills") or []
    if not soft:
      return []
    flowables = [Paragraph(sec.get("title") or "SOFT SKILLS", h1_style)]
    soft_str = ", ".join([clean_unicode(str(x)) for x in soft])
    flowables.append(Paragraph(soft_str, body_style))
    flowables.append(Spacer(1, 4))
    return flowables

  def make_internships_flowables(sec):
    internships = resume_data.get("internships") or []
    if not internships:
      return []
    flowables = [Paragraph(sec.get("title") or "INTERNSHIPS", h1_style)]
    for intern in internships:
      role = clean_unicode(intern.get("role") or "Intern")
      company = clean_unicode(intern.get("company") or "Company")
      duration = clean_unicode(intern.get("duration") or "")
      loc = clean_unicode(intern.get("location") or "")
      desc = clean_unicode(intern.get("description") or "")
      
      header = f"<b>{role}</b> — {company}"
      if loc:
        header += f" ({loc})"
        
      table = Table(
        [[Paragraph(header, body_style), Paragraph(duration, ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))]],
        colWidths=[380, 152] if (custom_tpl and custom_tpl.get("layout") in ["two-column", "sidebar"]) else [420, 112]
      )
      table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
      ]))
      
      block = [table]
      if desc:
        bullets = [b.strip() for b in re.split(r'[\*\u2022•\n]', desc) if b.strip()]
        if len(bullets) > 1:
          for bullet in bullets:
            block.append(Paragraph(f"• {clean_unicode(bullet)}", bullet_style))
        else:
          block.append(Paragraph(desc, body_style))
      flowables.append(KeepTogether(block))
      flowables.append(Spacer(1, 4))
    return flowables

  def make_languages_flowables(sec):
    langs = resume_data.get("languages") or []
    if not langs:
      return []
    flowables = [Paragraph(sec.get("title") or "LANGUAGES", h1_style)]
    langs_str = ", ".join([clean_unicode(str(x)) for x in langs])
    flowables.append(Paragraph(langs_str, body_style))
    flowables.append(Spacer(1, 4))
    return flowables

  def make_publications_flowables(sec):
    pubs = resume_data.get("publications") or []
    if not pubs:
      return []
    flowables = [Paragraph(sec.get("title") or "PUBLICATIONS & RESEARCH PAPERS", h1_style)]
    for pub in pubs:
      title = clean_unicode(pub.get("title") or "")
      publisher = clean_unicode(pub.get("publisher") or "")
      year = clean_unicode(pub.get("year") or "")
      desc = clean_unicode(pub.get("description") or "")
      
      text = f"• <b>{title}</b>"
      if publisher:
        text += f" — {publisher}"
      if year:
        text += f" ({year})"
      if desc:
        text += f"<br/>{desc}"
      flowables.append(Paragraph(text, body_style))
    flowables.append(Spacer(1, 4))
    return flowables

  def render_section(sec):
    if not sec.get("visible", True):
      return []
    stype = sec.get("type", "").lower()
    if stype in ["profile", "summary"]:
      return make_summary_flowables(sec)
    elif stype == "experience":
      return make_experience_flowables(sec)
    elif stype == "education":
      return make_education_flowables(sec)
    elif stype == "projects":
      return make_projects_flowables(sec)
    elif stype == "skills":
      return make_skills_flowables(sec)
    elif stype in ["certifications", "certificates"]:
      return make_certifications_flowables(sec)
    elif stype == "achievements":
      return make_achievements_flowables(sec)
    elif stype == "softskills":
      return make_soft_skills_flowables(sec)
    elif stype == "internships":
      return make_internships_flowables(sec)
    elif stype == "languages":
      return make_languages_flowables(sec)
    elif stype == "publications":
      return make_publications_flowables(sec)
    elif stype == "hobbies":
      return make_hobbies_flowables(sec)
    return []

  # Divider border line underneath header
  header_story = [
    Paragraph(clean_name, title_style),
    Paragraph(contact_str, subtitle_style)
  ]
  if template in ["harvard", "stanford", "microsoft", "reactive"] or custom_tpl:
    rule_table = Table([[""]], colWidths=[532], rowHeights=[2])
    rule_table.setStyle(TableStyle([
      ('BACKGROUND', (0,0), (-1,-1), primary_color),
      ('BOTTOMPADDING', (0,0), (-1,-1), 0),
      ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    header_story.append(rule_table)
    header_story.append(Spacer(1, 10))

  story = []
  story.extend(header_story)

  # Check if template has layout sections
  sections_to_render = []
  if custom_tpl and "sections" in custom_tpl:
    sections_to_render = [
      {"type": sec, "visible": True} if isinstance(sec, str) else sec
      for sec in custom_tpl["sections"]
    ]
  else:
    sections_to_render = [
      {"type": "profile", "visible": True},
      {"type": "experience", "visible": True},
      {"type": "education", "visible": True},
      {"type": "projects", "visible": True},
      {"type": "skills", "visible": True},
      {"type": "softskills", "visible": True},
      {"type": "internships", "visible": True},
      {"type": "certifications", "visible": True},
      {"type": "achievements", "visible": True},
      {"type": "publications", "visible": True},
      {"type": "languages", "visible": True},
      {"type": "hobbies", "visible": True}
    ]

  layout = custom_tpl.get("layout") if custom_tpl else "single-column"

  if layout in ["two-column", "sidebar"]:
    left_types = ["experience", "education", "projects"]
    right_types = ["profile", "summary", "skills", "certifications", "achievements"]
    
    is_left_sidebar = layout == "sidebar"
    
    left_side_flowables = []
    right_side_flowables = []
    
    for sec in sections_to_render:
      stype = sec.get("type", "").lower()
      sec_flow = render_section(sec)
      if stype in left_types:
        (right_side_flowables if is_left_sidebar else left_side_flowables).extend(sec_flow)
      else:
        (left_side_flowables if is_left_sidebar else right_side_flowables).extend(sec_flow)
        
    # Table layout for two-column PDF output
    col_w = [180, 342] if is_left_sidebar else [342, 180]
    two_col_table = Table([[left_side_flowables, right_side_flowables]], colWidths=col_w)
    two_col_table.setStyle(TableStyle([
      ('VALIGN', (0,0), (-1,-1), 'TOP'),
      ('BOTTOMPADDING', (0,0), (-1,-1), 0),
      ('TOPPADDING', (0,0), (-1,-1), 0),
      ('LEFTPADDING', (0,0), (-1,-1), 0),
      ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(two_col_table)
  else:
    for sec in sections_to_render:
      story.extend(render_section(sec))

  doc.build(story)
  pdf_bytes = pdf_buffer.getvalue()
  pdf_buffer.close()
  return pdf_bytes
