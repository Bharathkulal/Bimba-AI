import math
from typing import List, Dict, Any, Tuple, Optional
from app.services.resume_pipeline.models import TextBlock, TableBlock, DocumentColumn, DocumentPage, BoundingBox

class LayoutAnalyzer:
    """
    Phase 3 & 11 — Layout Analysis & Multi-Column Reading Order.
    Preserves true natural reading order by detecting column boundaries and full-width header/footer spans.
    Prevents interleaving of left and right column texts.
    """

    @staticmethod
    def analyze_page_layout(
        page_number: int,
        page_width: float,
        page_height: float,
        blocks: List[TextBlock],
        tables: List[TableBlock] = None
    ) -> DocumentPage:
        tables = tables or []
        if not blocks and not tables:
            return DocumentPage(
                page_number=page_number,
                width=page_width,
                height=page_height,
                columns_count=1,
                columns=[],
                blocks=[],
                tables=[],
                raw_text=""
            )

        # 1. Identify full-width header blocks (e.g. Name/Contact across top)
        header_blocks = []
        footer_blocks = []
        body_blocks = []

        # Find median and range of horizontal spreads
        page_center = page_width / 2.0

        for b in blocks:
            if not b.bbox:
                body_blocks.append(b)
                continue

            bbox = b.bbox
            span_width = bbox.width
            is_full_width = span_width > (page_width * 0.65) or (bbox.x0 < page_width * 0.25 and bbox.x1 > page_width * 0.75)

            # Check if block is at the top (< 20% of page height)
            if is_full_width and bbox.y0 < (page_height * 0.22):
                header_blocks.append(b)
            # Check if block is at the bottom (> 85% of page height) and full width
            elif is_full_width and bbox.y0 > (page_height * 0.85):
                footer_blocks.append(b)
            else:
                body_blocks.append(b)

        # 2. Detect column structure in the body
        detected_columns, num_cols = LayoutAnalyzer._detect_columns(body_blocks, tables, page_width)

        # 3. Sort header blocks by y0 (top to bottom)
        header_blocks.sort(key=lambda b: b.bbox.y0 if b.bbox else 0)
        footer_blocks.sort(key=lambda b: b.bbox.y0 if b.bbox else 0)

        # 4. Assign body blocks and tables to columns
        column_objects: List[DocumentColumn] = []
        for col_idx, (col_x0, col_x1) in enumerate(detected_columns):
            col_blocks = []
            for b in body_blocks:
                if not b.bbox:
                    if col_idx == 0:
                        col_blocks.append(b)
                    continue
                mid_x = (b.bbox.x0 + b.bbox.x1) / 2.0
                # Assign to column if middle x or start x fits
                if col_x0 <= mid_x <= col_x1 or (col_idx == 0 and b.bbox.x0 < col_x1) or (col_idx == len(detected_columns)-1 and b.bbox.x1 > col_x0):
                    b.column_index = col_idx
                    col_blocks.append(b)
                elif b.bbox.x0 >= col_x0 and b.bbox.x0 <= col_x1:
                    b.column_index = col_idx
                    col_blocks.append(b)

            # Sort blocks within this column top-to-bottom
            col_blocks.sort(key=lambda b: b.bbox.y0 if b.bbox else 0)

            col_tables = []
            for t in tables:
                if t.bbox:
                    t_mid_x = (t.bbox.x0 + t.bbox.x1) / 2.0
                    if col_x0 <= t_mid_x <= col_x1:
                        t.column_index = col_idx
                        col_tables.append(t)
                elif col_idx == 0:
                    col_tables.append(t)

            col_tables.sort(key=lambda t: t.bbox.y0 if t.bbox else 0)

            column_objects.append(DocumentColumn(
                column_index=col_idx,
                x0=col_x0,
                x1=col_x1,
                blocks=col_blocks,
                tables=col_tables
            ))

        # 5. Build ordered text representation
        ordered_parts: List[str] = []

        # Add top header
        for b in header_blocks:
            if b.text.strip():
                ordered_parts.append(b.text.strip())

        # If single column, merge body blocks and tables in pure vertical order
        if num_cols == 1:
            all_body_items = []
            for b in body_blocks:
                all_body_items.append({"type": "block", "y0": b.bbox.y0 if b.bbox else 0, "item": b})
            for t in tables:
                all_body_items.append({"type": "table", "y0": t.bbox.y0 if t.bbox else 0, "item": t})
            all_body_items.sort(key=lambda x: x["y0"])

            for item in all_body_items:
                if item["type"] == "block":
                    t_str = item["item"].text.strip()
                    if t_str:
                        ordered_parts.append(t_str)
                elif item["type"] == "table":
                    t_rep = LayoutAnalyzer._render_table_text(item["item"])
                    if t_rep:
                        ordered_parts.append(t_rep)
        else:
            # Multi-column: read column by column from left to right (or sidebar then main)
            for col in column_objects:
                col_items = []
                for b in col.blocks:
                    col_items.append({"type": "block", "y0": b.bbox.y0 if b.bbox else 0, "item": b})
                for t in col.tables:
                    col_items.append({"type": "table", "y0": t.bbox.y0 if t.bbox else 0, "item": t})
                col_items.sort(key=lambda x: x["y0"])

                for item in col_items:
                    if item["type"] == "block":
                        t_str = item["item"].text.strip()
                        if t_str:
                            ordered_parts.append(t_str)
                    elif item["type"] == "table":
                        t_rep = LayoutAnalyzer._render_table_text(item["item"])
                        if t_rep:
                            ordered_parts.append(t_rep)

        # Add footer blocks
        for b in footer_blocks:
            if b.text.strip():
                ordered_parts.append(b.text.strip())

        full_page_text = "\n".join(ordered_parts).strip()

        # Re-assemble all blocks in natural reading order
        final_ordered_blocks = header_blocks + [b for col in column_objects for b in col.blocks] + footer_blocks

        return DocumentPage(
            page_number=page_number,
            width=page_width,
            height=page_height,
            columns_count=num_cols,
            columns=column_objects,
            blocks=final_ordered_blocks,
            tables=tables,
            raw_text=full_page_text
        )

    @staticmethod
    def _detect_columns(
        blocks: List[TextBlock],
        tables: List[TableBlock],
        page_width: float
    ) -> Tuple[List[Tuple[float, float]], int]:
        """
        Detects if blocks fall into 1, 2, or 3 columns based on x-coordinate clustering.
        """
        if not blocks:
            return [(0.0, page_width)], 1

        x_coords = []
        for b in blocks:
            if b.bbox and b.bbox.width < page_width * 0.70:
                x_coords.append((b.bbox.x0, b.bbox.x1))

        if len(x_coords) < 4:
            return [(0.0, page_width)], 1

        # Check left/right column division (approx 30-70% or 50-50%)
        # Look for a vertical gap where no block starts or has center
        left_blocks = [x0 for x0, x1 in x_coords if x0 < page_width * 0.45 and x1 < page_width * 0.55]
        right_blocks = [x0 for x0, x1 in x_coords if x0 >= page_width * 0.35 and x1 <= page_width]

        # Check if significant portion of blocks exist on both sides
        if len(left_blocks) >= 3 and len(right_blocks) >= 3:
            # Determine split boundary
            max_left = max((x1 for x0, x1 in x_coords if x0 < page_width * 0.45 and x1 < page_width * 0.55), default=page_width * 0.35)
            min_right = min((x0 for x0, x1 in x_coords if x0 >= page_width * 0.35), default=page_width * 0.40)
            
            split_x = (max_left + min_right) / 2.0
            if 0.25 * page_width < split_x < 0.75 * page_width:
                return [(0.0, split_x), (split_x, page_width)], 2

        return [(0.0, page_width)], 1

    @staticmethod
    def _render_table_text(table: TableBlock) -> str:
        lines = ["<TABLE>"]
        if table.headers:
            clean_headers = [str(h).strip().replace("\n", " ") for h in table.headers]
            if any(clean_headers):
                lines.append("<TR-HEADER> " + " | ".join(clean_headers))
        for row in table.rows:
            clean_cells = [str(c).strip().replace("\n", " ") for c in row]
            if any(clean_cells):
                lines.append("<TR> " + " | ".join(clean_cells))
        lines.append("</TABLE>")
        return "\n".join(lines)
