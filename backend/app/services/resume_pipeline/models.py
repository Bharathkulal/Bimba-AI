from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

class SpanInfo(BaseModel):
    text: str
    font: Optional[str] = ""
    size: Optional[float] = 0.0
    flags: Optional[int] = 0
    color: Optional[int] = 0
    is_bold: bool = False
    is_italic: bool = False

class BoundingBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float
    
    @property
    def width(self) -> float:
        return max(0.0, self.x1 - self.x0)
    
    @property
    def height(self) -> float:
        return max(0.0, self.y1 - self.y0)

class TextBlock(BaseModel):
    id: str
    page_number: int
    text: str
    bbox: Optional[BoundingBox] = None
    column_index: int = 0
    spans: List[SpanInfo] = Field(default_factory=list)
    is_heading: bool = False
    heading_level: Optional[int] = None
    section_category: Optional[str] = None
    font_size: float = 0.0
    is_bold: bool = False

class TableCell(BaseModel):
    text: str
    row_idx: int
    col_idx: int
    is_header: bool = False
    bbox: Optional[BoundingBox] = None

class TableBlock(BaseModel):
    id: str
    page_number: int
    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)
    bbox: Optional[BoundingBox] = None
    raw_data: List[List[Any]] = Field(default_factory=list)
    column_index: int = 0

class DocumentColumn(BaseModel):
    column_index: int
    x0: float
    x1: float
    blocks: List[TextBlock] = Field(default_factory=list)
    tables: List[TableBlock] = Field(default_factory=list)

class DocumentPage(BaseModel):
    page_number: int
    width: float
    height: float
    columns_count: int = 1
    columns: List[DocumentColumn] = Field(default_factory=list)
    blocks: List[TextBlock] = Field(default_factory=list)
    tables: List[TableBlock] = Field(default_factory=list)
    raw_text: str = ""
    is_scanned: bool = False
    confidence: float = 1.0

class NormalizedDocument(BaseModel):
    filename: str
    doc_type: str  # "pdf_text", "pdf_scanned", "pdf_mixed", "docx", "txt"
    pages: List[DocumentPage] = Field(default_factory=list)
    page_count: int = 1
    full_text: str = ""
    extraction_method: str = "PyMuPDF"
    extraction_confidence: float = 1.0
    content_preservation_score: float = 1.0
    tables: List[TableBlock] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
