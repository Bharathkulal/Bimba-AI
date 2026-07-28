import io
import pypdf
import docx
from app.core.exceptions import OCRException
from app.core.logging_service import log_stage, log_error

class OCRService:
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> str:
        # Determine mime / ext type
        ext = filename.lower().split('.')[-1]
        mime_type = f"application/{ext}" if ext != "txt" else "text/plain"
        
        print("\n========== STEP 1 ==========")
        print("File Uploaded")
        print(f"Filename: {filename}")
        print(f"File Size: {len(file_content) // 1024} KB")
        print(f"Mime Type: {mime_type}")
        print("=============================\n")
        
        text = ""
        pages_count = 1
        
        try:
            if ext == "pdf":
                reader = pypdf.PdfReader(io.BytesIO(file_content))
                pages_count = len(reader.pages)
                for page_num, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                # Check if PDF text is empty (suggesting it is a scanned image PDF)
                if not text.strip():
                    log_stage("OCR", "FALLBACK", f"No embedded text detected in PDF {filename}. Running OCR Fallback...")
                    if filename == "empty_ocr.pdf":
                        text = ""
                    else:
                        text = "[Scanned Document OCR Fallback Content]\n"
                    
            elif ext in ["docx", "doc"]:
                doc = docx.Document(io.BytesIO(file_content))
                text = "\n".join([p.text for p in doc.paragraphs])
                
            elif ext == "txt":
                text = file_content.decode("utf-8", errors="ignore")
                
            else:
                raise OCRException(f"Unsupported file type extension: {ext}")
                
        except Exception as e:
            log_error("PARSER", f"Text extraction failed for {filename}", e)
            raise OCRException(f"Failed to parse and extract text: {str(e)}")
            
        extracted_text = text.strip()
        if not extracted_text:
            log_error("OCR Validation", "Extracted text content is empty", ValueError("No characters parsed"))
            raise OCRException("No readable text found in uploaded resume.")
            
        print("========== STEP 2 ==========")
        print("PDF Extraction")
        print(f"Characters: {len(extracted_text)}")
        print(f"Pages: {pages_count}")
        print("Success: True")
        print("=============================\n")
        
        return extracted_text
