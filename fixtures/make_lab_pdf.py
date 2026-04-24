"""Generate the sanitized lab PDF for the Health Companion demo.

All values below are either (a) direct from Juan Manuel's real lab with
the PHI/PII stripped, or (b) adjusted for the synthetic patient profile
(Laura, 44 y/o female) and for the Act-2 narrative anchor (fasting
glucose 118 mg/dL).

Patient header is synthetic. Facility identifiers, technician name, and
any contact info are redacted. A visible "DEMO / SYNTHETIC DATA" band
is printed on every page so the file is self-documenting.
"""
from __future__ import annotations

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

OUT = "/tmp/labs-laura-demo.pdf"

PAGE_W, PAGE_H = letter  # 612 x 792 pt
MARGIN_L = 18 * mm
MARGIN_R = 18 * mm
MARGIN_T = 14 * mm
MARGIN_B = 18 * mm

# ─────────────────────────── patient header ───────────────────────────
PATIENT = {
    "Paciente": "LAURA FERNÁNDEZ HERRERA",
    "Sucursal": "Laboratorio Demo",
    "Médico": "Medicina Preventiva",
    "Procedencia": "RECEPCIÓN",
    "Sexo": "Femenino",
    "Expediente": "0000012345 / 000001 - 1",
    "Fecha nac": "15/03/1982",
    "Edad": "44.01.20",
    "Fecha sol": "05/01/2026 07:43",
    "Fecha toma": "05/01/2026 07:53",
    "Fecha val": "05/01/2026 09:05",
    "Fecha imp": "05/01/2026 09:05",
}

HEADER_LEFT_KEYS = ["Paciente", "Médico", "Sexo", "Fecha nac", "Fecha sol", "Fecha val"]
HEADER_RIGHT_KEYS = ["Sucursal", "Procedencia", "Expediente", "Edad", "Fecha toma", "Fecha imp"]


# ─────────────────────────── lab data ─────────────────────────────────
# Format: (name, value_str, up_arrow, unit, ref)
# up_arrow True renders a ↑ before the value to match how the original lab
# flags out-of-range findings.

PAGE_1_BIOMETRIA_RED = [
    ("ERITROCITOS", "4.82", False, "10^6/µL", "4.2 - 5.4"),
    ("HEMOGLOBINA", "14.2", False, "g/dL", "12.0 - 15.5"),
    ("HEMATOCRITO", "42", False, "%", "36 - 44.9"),
    ("VOLUMEN GLOBULAR MEDIO (VCM)", "89.3", False, "fL", "82 - 100"),
    ("HEMOGLOBINA CORPUSCULAR MEDIA (HCM)", "30.4", False, "pg", "27.1 - 33.5"),
    ("CONC. HEMOGLOBINA CORPUSCULAR MEDIA (CHCM)", "34", False, "g/dL", "31.6 - 34.8"),
    ("INDICE DE DISTRIBUCIÓN ERITROCITARIA (RDW)", "12.9", False, "%", "11.8 - 17.6"),
    ("PLAQUETAS", "257", False, "10^3/µL", "147 - 384"),
    ("VOLUMEN PLAQUETARIO MEDIO", "9.4", False, "fL", "6.5 - 11"),
]
PAGE_1_BIOMETRIA_WHITE = [
    ("LEUCOCITOS TOTALES", "5.78", False, "10^3/µL", "3.8 - 9.7"),
    ("NEUTRÓFILOS SEGMENTADOS", "54.1", False, "%", "39.6 - 76.1"),
    ("LINFOCITOS", "32.9", False, "%", "15.5 - 48.6"),
    ("MONOCITOS", "8.8", False, "%", "3.4 - 10.1"),
    ("EOSINÓFILOS", "3.1", False, "%", "0.3 - 4.5"),
    ("BASÓFILOS", "0.9", False, "%", "0 - 1.6"),
    ("NEUTRÓFILOS EN BANDAS", "0", False, "%", "0 - 5"),
    ("GRANULOCITOS INMADUROS", "0.2", False, "%", "0 - 2"),
    ("NEUTRÓFILOS ABSOLUTOS", "3.13", False, "10^3/µL", "1.7 - 6.4"),
    ("LINFOCITOS ABSOLUTOS", "1.90", False, "10^3/µL", "0.9 - 3.2"),
    ("MONOCITOS ABSOLUTOS", "0.51", False, "10^3/µL", "0.2 - 0.7"),
    ("EOSINÓFILOS ABSOLUTOS", "0.18", False, "10^3/µL", "0 - 0.3"),
    ("BASÓFILOS ABSOLUTOS", "0.05", False, "10^3/µL", "0 - 0.1"),
]

PAGE_2_QS_TOP = [
    ("DIOXIDO DE CARBONO (CO2)", "30.6", True, "mEq/L", "22 - 29"),
    ("GLUCOSA EN SUERO", "118", True, "mg/dL", "65 - 99"),
    ("NITROGENO UREICO EN SUERO (BUN)", "11", False, "mg/dL", "6 - 20"),
    ("UREA EN SUERO", "23.5", False, "mg/dL", "16.6 - 48.5"),
    ("CREATININA EN SUERO", "0.85", False, "mg/dL", "0.5 - 1.1"),
    ("ACIDO URICO", "4.8", False, "mg/dL", "2.4 - 6.0"),
]

PAGE_2_CHOLESTEROL = [
    ("COLESTEROL TOTAL", "223", True, "mg/dL", "Deseable ≤ 200"),
    ("TRIGLICERIDOS", "92.5", False, "mg/dL", "Normal ≤ 150"),
    ("COLESTEROL DE BAJA DENSIDAD (LDL)", "136", True, "mg/dL", "Óptimo ≤ 100"),
    ("COLESTEROL sd-LDL (PARTÍCULAS PEQUEÑAS Y DENSAS)", "36.71", False, "mg/dL", "< 50"),
]

PAGE_3_LIPIDS = [
    ("COLESTEROL DE ALTA DENSIDAD (HDL)", "70.1", False, "mg/dL", "Femenino ≥ 50"),
    ("COLESTEROL DE MUY BAJA DENSIDAD (VLDL)", "19", False, "mg/dL", "—"),
    ("COLESTEROL NO HDL", "153", True, "mg/dL", "0 - 130"),
    ("INDICE ATEROGENICO", "3", False, "", "0 - 4"),
]
PAGE_3_PROTEINS = [
    ("PROTEINAS TOTALES EN SUERO", "7.45", False, "g/dL", "6.1 - 8.1"),
    ("ALBUMINA EN SUERO", "4.74", False, "g/dL", "3.5 - 5.2"),
    ("GLOBULINA EN SUERO", "2.70", False, "g/dL", "1.9 - 3.7"),
    ("RELACION ALBUMINA/GLOBULINA", "1.8", False, "", "1 - 2.5"),
    ("BILIRRUBINA TOTAL", "0.57", False, "mg/dL", "0.2 - 1.2"),
    ("BILIRRUBINA DIRECTA", "0.22", True, "mg/dL", "0 - 0.2"),
    ("BILIRRUBINA INDIRECTA", "0.35", False, "mg/dL", "0.2 - 1.2"),
]
PAGE_3_ENZYMES = [
    ("TRANSAMINASA GLUTAMICO OXALACETICA (TGO)", "31.4", False, "U/L", "0 - 40"),
    ("TRANSAMINASA GLUTAMICO PIRUVICA (TGP)", "48", True, "U/L", "0 - 41"),
    ("DESHIDROGENASA LACTICA EN SUERO", "175", False, "U/L", "122 - 222"),
    ("GAMMA GLUTAMIL TRANSFERASA (GGT)", "14.7", False, "U/L", "10 - 71"),
    ("FOSFATASA ALCALINA EN SUERO", "75.4", False, "U/L", "40 - 129"),
]
PAGE_3_ELECTROLYTES = [
    ("SODIO EN SUERO", "142.5", False, "mmol/L", "136 - 145"),
    ("POTASIO EN SUERO", "5.0", False, "mmol/L", "3.5 - 5.1"),
    ("CLORO EN SUERO", "103.9", False, "mmol/L", "98 - 107"),
    ("CALCIO EN SUERO", "10.1", True, "mg/dL", "8.6 - 10.0"),
    ("FOSFORO EN SUERO", "3.67", False, "mg/dL", "2.5 - 4.5"),
    ("MAGNESIO EN SUERO", "2.31", False, "mg/dL", "1.6 - 2.6"),
    ("AMILASA EN SUERO", "136", True, "U/L", "28 - 100"),
    ("LIPASA EN SUERO", "45.1", False, "U/L", "13 - 60"),
    ("HIERRO EN SUERO", "132", False, "µg/dL", "33 - 193"),
]

PAGE_4_IRON = [
    ("CAPACIDAD DE FIJACION DE HIERRO", "334", False, "µg/dL", "250 - 400"),
    ("PORCENTAJE DE SATURACION DE TRANSFERRINA", "39.52", False, "%", "14 - 50"),
    ("TRANSFERRINA", "262", False, "mg/dL", "200 - 360"),
    ("FERRITINA", "97.7", False, "ng/mL", "31 - 409"),
]
PAGE_4_INFLAM = [
    ("PROTEINA C REACTIVA ULTRASENSIBLE", "0.93", False, "mg/L", "Riesgo bajo < 1.0"),
]


# ─────────────────────────── rendering helpers ────────────────────────

def draw_demo_band(c: canvas.Canvas, page: int, total: int) -> None:
    """Top-of-page demo band so the file is self-documenting."""
    c.saveState()
    c.setFillColorRGB(0.99, 0.95, 0.80)
    c.setStrokeColorRGB(0.85, 0.70, 0.30)
    c.rect(MARGIN_L, PAGE_H - 10 * mm, PAGE_W - MARGIN_L - MARGIN_R, 5.5 * mm, fill=1, stroke=1)
    c.setFillColorRGB(0.55, 0.40, 0.05)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_L + 2 * mm, PAGE_H - 8.2 * mm, "DEMO · SYNTHETIC DATA")
    c.setFont("Helvetica", 7.5)
    c.drawRightString(
        PAGE_W - MARGIN_R - 2 * mm,
        PAGE_H - 8.2 * mm,
        "Illustrative lab for Health Companion hackathon demo · not a real patient",
    )
    c.restoreState()


def draw_patient_header(c: canvas.Canvas) -> float:
    """Patient info block. Returns the y-coord just below it."""
    # Top-right brand placeholder (neutral, non-identifying).
    c.saveState()
    c.setFillColorRGB(0.30, 0.30, 0.30)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 18 * mm, "LABORATORIO DEMO")
    c.setFont("Helvetica", 8)
    c.setFillColorRGB(0.50, 0.50, 0.50)
    c.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 22 * mm, "synthetic · illustrative")
    c.restoreState()

    y = PAGE_H - 26 * mm
    row_h = 4.2 * mm
    label_x_l = MARGIN_L
    value_x_l = MARGIN_L + 24 * mm
    label_x_r = PAGE_W / 2 + 6 * mm
    value_x_r = PAGE_W / 2 + 30 * mm

    for i in range(len(HEADER_LEFT_KEYS)):
        k_l = HEADER_LEFT_KEYS[i]
        k_r = HEADER_RIGHT_KEYS[i]
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColorRGB(0, 0, 0)
        c.drawString(label_x_l, y, f"{k_l}:")
        c.drawString(label_x_r, y, f"{k_r}:")
        c.setFont("Helvetica", 8.5)
        c.drawString(value_x_l, y, PATIENT[k_l])
        c.drawString(value_x_r, y, PATIENT[k_r])
        y -= row_h

    y -= 2 * mm
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(0.4)
    c.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
    y -= 4 * mm

    # Column headers
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN_L, y, "")
    c.drawRightString(PAGE_W / 2 + 18 * mm, y, "RESULTADO")
    c.drawString(PAGE_W / 2 + 30 * mm, y, "UNIDADES")
    c.drawRightString(PAGE_W - MARGIN_R, y, "VALORES REF.")
    y -= 2 * mm
    c.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
    y -= 4 * mm
    return y


def draw_section_header(c: canvas.Canvas, y: float, title: str, meta: str | None = None) -> float:
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(MARGIN_L, y, title)
    y -= 3.8 * mm
    if meta:
        c.setFont("Helvetica", 7.5)
        c.setFillColorRGB(0.35, 0.35, 0.35)
        c.drawString(MARGIN_L, y, meta)
        y -= 3.5 * mm
    return y


def draw_subheader(c: canvas.Canvas, y: float, title: str) -> float:
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(MARGIN_L, y, title)
    y -= 3.8 * mm
    return y


def draw_row(c: canvas.Canvas, y: float, row: tuple[str, str, bool, str, str]) -> float:
    name, value, up, unit, ref = row
    c.setFont("Helvetica", 8.5)
    c.setFillColorRGB(0, 0, 0)
    # Wrap long names onto a second line (rare but present in the source)
    if len(name) > 52:
        first, second = name[:52], name[52:]
        # Try splitting on last space before 52
        cut = name.rfind(" ", 0, 52)
        if cut > 0:
            first = name[:cut]
            second = name[cut + 1 :]
        c.drawString(MARGIN_L, y, first)
        y -= 3.5 * mm
        c.drawString(MARGIN_L, y, second)
    else:
        c.drawString(MARGIN_L, y, name)

    # Right-aligned value with optional up-arrow
    value_str = f"↑ {value}" if up else value
    if up:
        c.setFillColorRGB(0.72, 0.26, 0.05)
    c.setFont("Helvetica-Bold" if up else "Helvetica", 8.5)
    c.drawRightString(PAGE_W / 2 + 18 * mm, y, value_str)

    # Unit + ref in monochrome
    c.setFont("Helvetica", 8.5)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(PAGE_W / 2 + 30 * mm, y, unit)
    c.drawRightString(PAGE_W - MARGIN_R, y, ref)

    y -= 4.2 * mm
    return y


def draw_footer(c: canvas.Canvas, page: int, total: int) -> None:
    c.saveState()
    c.setStrokeColorRGB(0.80, 0.80, 0.80)
    c.setLineWidth(0.3)
    c.line(MARGIN_L, MARGIN_B + 9 * mm, PAGE_W - MARGIN_R, MARGIN_B + 9 * mm)
    c.setFont("Helvetica", 7.5)
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.drawString(
        MARGIN_L,
        MARGIN_B + 5 * mm,
        "Responsable sanitario del laboratorio · firma electrónica · cédula en archivo",
    )
    c.drawString(
        MARGIN_L, MARGIN_B + 1.5 * mm, "Informe sintético · Health Companion · no apto para uso clínico"
    )
    c.drawRightString(PAGE_W - MARGIN_R, MARGIN_B + 5 * mm, f"Página {page} de {total}")
    c.restoreState()


def build_page(c: canvas.Canvas, page_num: int, total_pages: int, body_fn) -> None:
    draw_demo_band(c, page_num, total_pages)
    y = draw_patient_header(c)
    body_fn(c, y)
    draw_footer(c, page_num, total_pages)
    c.showPage()


def page_1_body(c: canvas.Canvas, y: float) -> None:
    y = draw_section_header(
        c, y, "BIOMETRIA HEMATICA", "Tipo de muestra: SANGRE TOTAL EDTA · Metodología: impedancia/flow"
    )
    y = draw_subheader(c, y, "FORMULA ROJA")
    for row in PAGE_1_BIOMETRIA_RED:
        y = draw_row(c, y, row)
    y -= 1 * mm
    y = draw_subheader(c, y, "FORMULA BLANCA")
    for row in PAGE_1_BIOMETRIA_WHITE:
        y = draw_row(c, y, row)


def page_2_body(c: canvas.Canvas, y: float) -> None:
    y = draw_section_header(
        c, y, "QUIMICA SANGUINEA DE 40 ELEMENTOS", "Tipo de muestra: SUERO · Metodología: VARIAS"
    )
    for row in PAGE_2_QS_TOP:
        y = draw_row(c, y, row)
    y -= 2 * mm
    y = draw_subheader(c, y, "PERFIL DE LÍPIDOS (1/2)")
    for row in PAGE_2_CHOLESTEROL:
        y = draw_row(c, y, row)


def page_3_body(c: canvas.Canvas, y: float) -> None:
    y = draw_subheader(c, y, "PERFIL DE LÍPIDOS (2/2)")
    for row in PAGE_3_LIPIDS:
        y = draw_row(c, y, row)
    y -= 1 * mm
    y = draw_subheader(c, y, "PROTEÍNAS Y BILIRRUBINAS")
    for row in PAGE_3_PROTEINS:
        y = draw_row(c, y, row)
    y -= 1 * mm
    y = draw_subheader(c, y, "ENZIMAS HEPÁTICAS")
    for row in PAGE_3_ENZYMES:
        y = draw_row(c, y, row)
    y -= 1 * mm
    y = draw_subheader(c, y, "ELECTROLITOS Y MINERALES")
    for row in PAGE_3_ELECTROLYTES:
        y = draw_row(c, y, row)


def page_4_body(c: canvas.Canvas, y: float) -> None:
    y = draw_subheader(c, y, "PERFIL DE HIERRO")
    for row in PAGE_4_IRON:
        y = draw_row(c, y, row)
    y -= 2 * mm
    y = draw_subheader(c, y, "INFLAMACIÓN")
    for row in PAGE_4_INFLAM:
        y = draw_row(c, y, row)
    y -= 2 * mm
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.drawString(MARGIN_L, y, "Riesgo bajo: < 1.0 · Riesgo medio: 1.0 - 3.0 · Riesgo alto: > 3.0")
    y -= 6 * mm
    c.setFont("Helvetica-Oblique", 7.5)
    c.drawString(
        MARGIN_L,
        y,
        "Fin del informe. Valores sintéticos generados para Health Companion · hackathon Opus 4.7.",
    )


def main() -> None:
    c = canvas.Canvas(OUT, pagesize=letter)
    c.setTitle("Laboratorio Demo · Laura Fernández Herrera")
    c.setAuthor("Health Companion")
    c.setSubject("Synthetic laboratory report for hackathon demo")
    c.setKeywords("demo synthetic illustrative")

    total = 4
    build_page(c, 1, total, page_1_body)
    build_page(c, 2, total, page_2_body)
    build_page(c, 3, total, page_3_body)
    build_page(c, 4, total, page_4_body)

    c.save()
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
