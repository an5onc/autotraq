from __future__ import annotations

import html
import math
import textwrap
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
PITCH_DIR = ROOT / "source-documents" / "pitch"
OUT = PITCH_DIR / "AutoTraQ_Feature_Showcase.pptx"
PREVIEW_DIR = PITCH_DIR / "feature-showcase-assets" / "previews"
MONTAGE = PITCH_DIR / "feature-showcase-assets" / "feature_showcase_montage.png"

W_IN, H_IN = 13.333333, 7.5
EMU_PER_IN = 914400
SLIDE_W = int(W_IN * EMU_PER_IN)
SLIDE_H = int(H_IN * EMU_PER_IN)
PX_W, PX_H = 1600, 900


COLORS = {
    "bg": "0B1120",
    "panel": "111827",
    "panel2": "172033",
    "line": "334155",
    "muted": "94A3B8",
    "text": "F8FAFC",
    "white": "FFFFFF",
    "amber": "F59E0B",
    "amber2": "FBBF24",
    "green": "10B981",
    "blue": "38BDF8",
    "red": "EF4444",
    "purple": "A78BFA",
    "cyan": "22D3EE",
}


def emu(v: float) -> int:
    return int(v * EMU_PER_IN)


def px(v: float) -> int:
    return int(v * 120)


def esc(s: str) -> str:
    return html.escape(str(s), quote=True)


@dataclass
class Shape:
    kind: str
    x: float
    y: float
    w: float
    h: float
    text: str = ""
    fill: str = "transparent"
    line: str = "transparent"
    radius: bool = False
    font_size: int = 18
    bold: bool = False
    color: str = "text"
    align: str = "l"
    valign: str = "t"
    name: str = "Shape"


@dataclass
class SlideSpec:
    title: str
    subtitle: str = ""
    eyebrow: str = "AUTOTRAQ"
    shapes: list[Shape] = field(default_factory=list)
    notes: str = ""


def shape_xml(shape: Shape, sid: int) -> str:
    x, y, w, h = emu(shape.x), emu(shape.y), emu(shape.w), emu(shape.h)
    preset = "roundRect" if shape.radius else "rect"
    fill = ""
    if shape.fill == "transparent":
        fill = "<a:noFill/>"
    else:
        fill = f'<a:solidFill><a:srgbClr val="{COLORS.get(shape.fill, shape.fill)}"/></a:solidFill>'
    line = ""
    if shape.line == "transparent":
        line = '<a:ln><a:noFill/></a:ln>'
    else:
        line = f'<a:ln w="12700"><a:solidFill><a:srgbClr val="{COLORS.get(shape.line, shape.line)}"/></a:solidFill></a:ln>'
    tx = ""
    if shape.text:
        paragraphs = []
        for raw in shape.text.split("\n"):
            if raw == "":
                paragraphs.append("<a:p/>")
                continue
            paragraphs.append(
                f'<a:p><a:pPr algn="{shape.align}"/>'
                f'<a:r><a:rPr lang="en-US" sz="{shape.font_size * 100}" '
                f'{"b=\"1\"" if shape.bold else ""}>'
                f'<a:solidFill><a:srgbClr val="{COLORS.get(shape.color, shape.color)}"/></a:solidFill>'
                f'<a:latin typeface="Aptos"/></a:rPr><a:t>{esc(raw)}</a:t></a:r>'
                f'<a:endParaRPr lang="en-US" sz="{shape.font_size * 100}"/></a:p>'
            )
        tx = (
            f'<p:txBody><a:bodyPr wrap="square" anchor="{shape.valign}" lIns="91440" rIns="91440" '
            f'tIns="45720" bIns="45720"/><a:lstStyle/>{"".join(paragraphs)}</p:txBody>'
        )
    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="{esc(shape.name)} {sid}"/>'
        f'<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        f'<a:prstGeom prst="{preset}"><a:avLst/></a:prstGeom>{fill}{line}</p:spPr>{tx}</p:sp>'
    )


def line_xml(x1: float, y1: float, x2: float, y2: float, sid: int, color: str = "line", width: int = 2) -> str:
    x, y = min(x1, x2), min(y1, y2)
    w, h = abs(x2 - x1), abs(y2 - y1)
    flip_h = ' flipH="1"' if x2 < x1 else ""
    flip_v = ' flipV="1"' if y2 < y1 else ""
    return (
        f'<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="{sid}" name="Connector {sid}"/>'
        f'<p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr>'
        f'<a:xfrm{flip_h}{flip_v}><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
        f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom>'
        f'<a:ln w="{width * 12700}"><a:solidFill><a:srgbClr val="{COLORS[color]}"/></a:solidFill></a:ln>'
        f'</p:spPr></p:cxnSp>'
    )


def slide_xml(spec: SlideSpec) -> str:
    shapes = [
        Shape("rect", 0, 0, W_IN, H_IN, fill="bg", name="Background"),
        Shape("text", 0.58, 0.34, 2.4, 0.25, spec.eyebrow, font_size=9, bold=True, color="amber", name="Eyebrow"),
        Shape("text", 0.58, 0.62, 7.7, 0.72, spec.title, font_size=30, bold=True, color="text", name="Title"),
    ]
    if spec.subtitle:
        shapes.append(Shape("text", 0.62, 1.28, 8.4, 0.42, spec.subtitle, font_size=14, color="muted", name="Subtitle"))
    shapes += spec.shapes
    xml_shapes = []
    sid = 2
    for sh in shapes:
        xml_shapes.append(shape_xml(sh, sid))
        sid += 1
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/>'
        '<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm>'
        '<a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/>'
        f'</a:xfrm></p:grpSpPr>{"".join(xml_shapes)}</p:spTree></p:cSld>'
        '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'
    )


def tx(x, y, w, h, text, size=18, color="text", bold=False, align="l", fill="transparent", line="transparent", radius=False):
    return Shape("text", x, y, w, h, text, fill=fill, line=line, radius=radius, font_size=size, bold=bold, color=color, align=align)


def box(x, y, w, h, fill="panel", line="line", radius=True):
    return Shape("rect", x, y, w, h, "", fill=fill, line=line, radius=radius)


def feature_pill(x, y, text, color="amber", w=2.35):
    return Shape("text", x, y, w, 0.38, text, fill="panel2", line=color, radius=True, font_size=11, bold=True, color=color, align="c", valign="mid")


def deck_specs() -> list[SlideSpec]:
    slides: list[SlideSpec] = []
    slides.append(SlideSpec(
        title="AutoTraQ Feature Showcase",
        subtitle="A browser-based inventory command center for automotive parts teams",
        shapes=[
            tx(0.62, 2.15, 5.2, 1.25, "100+\npractical features", 42, "amber", True),
            tx(0.66, 3.52, 5.2, 0.75, "Inventory, fitment, barcode scanning, requests, alerts, audit logs, reports, and admin controls in one shared web platform.", 18, "text"),
            box(7.15, 1.58, 4.95, 3.9, "panel", "line", True),
            tx(7.45, 1.92, 4.2, 0.35, "LIVE PRODUCT AREAS", 10, "muted", True),
            feature_pill(7.45, 2.42, "Parts Catalog", "amber", 1.9),
            feature_pill(9.55, 2.42, "Vehicle Fitment", "blue", 1.95),
            feature_pill(7.45, 3.0, "Inventory Ledger", "green", 2.05),
            feature_pill(9.7, 3.0, "Barcode Scan", "purple", 1.8),
            feature_pill(7.45, 3.58, "Requests", "cyan", 1.55),
            feature_pill(9.2, 3.58, "Audit Logs", "red", 1.6),
            feature_pill(7.45, 4.16, "Reorder Intelligence", "amber2", 2.35),
            feature_pill(9.98, 4.16, "Reports", "blue", 1.25),
            tx(0.66, 6.68, 7.4, 0.24, "Built for web production: one URL, one database, every team member on the same current version.", 11, "muted"),
        ],
    ))
    slides.append(SlideSpec(
        title="Why Web Production Wins",
        subtitle="The product is stronger as a hosted web app than as a copied desktop installer.",
        shapes=[
            tx(0.8, 2.15, 2.6, 0.5, "No installers", 28, "amber", True),
            tx(0.82, 2.75, 2.7, 1.25, "Clients open a URL, log in, and work from any approved browser.", 17),
            tx(4.55, 2.15, 2.7, 0.5, "One source of truth", 28, "green", True),
            tx(4.57, 2.75, 2.85, 1.25, "Inventory, users, scans, and requests all share the same production database.", 17),
            tx(8.5, 2.15, 2.7, 0.5, "Instant updates", 28, "blue", True),
            tx(8.52, 2.75, 2.85, 1.25, "Deploy once; every client computer gets the current version automatically.", 17),
            Shape("rect", 0.72, 4.8, 11.9, 0.03, fill="line", line="transparent"),
            tx(1.05, 5.25, 10.8, 0.5, "Client onboarding becomes simple: account + website URL + role.", 24, "text", True, align="c"),
        ],
    ))
    slides.append(SlideSpec(
        title="The Platform in One View",
        subtitle="AutoTraQ connects the core operations a parts team repeats every day.",
        shapes=[
            box(4.85, 2.25, 3.65, 1.25, "panel2", "amber", True),
            tx(5.12, 2.55, 3.1, 0.45, "AutoTraQ Web App", 24, "amber", True, align="c"),
            tx(5.18, 3.03, 3.0, 0.25, "shared browser workspace", 11, "muted", align="c"),
            feature_pill(0.85, 1.55, "Parts + Images", "amber", 2.4),
            feature_pill(0.85, 2.55, "Vehicle Fitment", "blue", 2.4),
            feature_pill(0.85, 3.55, "Interchange", "purple", 2.4),
            feature_pill(10.0, 1.55, "Inventory Events", "green", 2.4),
            feature_pill(10.0, 2.55, "Requests", "cyan", 2.4),
            feature_pill(10.0, 3.55, "Reports + CSV", "amber2", 2.4),
            feature_pill(5.45, 5.2, "Auth • Roles • Audit • Notifications", "red", 3.3),
        ],
    ))
    slides.append(SlideSpec(
        title="Parts Catalog + Vehicle Fitment",
        subtitle="The catalog is built around real automotive lookup needs, not generic warehouse items.",
        shapes=[
            tx(0.82, 2.0, 4.2, 0.55, "Every part carries the details that matter", 24, "text", True),
            tx(0.85, 2.78, 4.6, 2.0, "SKU, name, condition, min stock, cost, retail price, OEM flag, part type, barcode data, images, and vehicle compatibility.", 20),
            box(6.35, 1.75, 5.45, 3.95, "panel", "line", True),
            tx(6.72, 2.12, 4.6, 0.38, "Example Part Detail", 17, "amber", True),
            tx(6.72, 2.75, 1.35, 0.25, "SKU", 9, "muted", True),
            tx(8.05, 2.75, 2.1, 0.25, "BRK-001", 13, "text", True),
            tx(6.72, 3.2, 1.35, 0.25, "Condition", 9, "muted", True),
            tx(8.05, 3.2, 2.1, 0.25, "GOOD", 13, "green", True),
            tx(6.72, 3.65, 1.35, 0.25, "Fits", 9, "muted", True),
            tx(8.05, 3.65, 3.1, 0.25, "2000 Honda Civic EX", 13, "blue", True),
            tx(6.72, 4.1, 1.35, 0.25, "Barcode", 9, "muted", True),
            Shape("text", 8.05, 4.03, 2.6, 0.38, "|||| ||| |||||", fill="white", line="transparent", radius=False, font_size=16, bold=True, color="bg", align="c"),
            tx(6.72, 4.68, 4.5, 0.42, "Inline editing, image gallery, stock add, fitment attach, and interchange membership.", 13, "muted"),
        ],
    ))
    slides.append(SlideSpec(
        title="Inventory Movement Is Traceable",
        subtitle="Stock is not just overwritten. AutoTraQ records inventory as events.",
        shapes=[
            feature_pill(1.1, 2.25, "Receive", "green", 1.65),
            feature_pill(3.35, 2.25, "Fulfill", "amber", 1.65),
            feature_pill(5.6, 2.25, "Return", "blue", 1.65),
            feature_pill(7.85, 2.25, "Correct", "purple", 1.65),
            tx(1.1, 3.25, 8.7, 0.6, "Each action creates an inventory event with part, location, quantity change, user, timestamp, and reason.", 24, "text", True),
            box(1.08, 4.4, 10.9, 1.18, "panel", "line", True),
            tx(1.42, 4.78, 10.2, 0.3, "Result: managers can explain exactly why stock changed, who changed it, and when it happened.", 18, "green", True, align="c"),
        ],
    ))
    slides.append(SlideSpec(
        title="Request Workflow",
        subtitle="Part requests move through an approval and fulfillment process instead of informal messages.",
        shapes=[
            feature_pill(0.95, 2.28, "Create", "blue", 1.55),
            feature_pill(3.05, 2.28, "Pending", "amber", 1.55),
            feature_pill(5.15, 2.28, "Approve", "green", 1.55),
            feature_pill(7.25, 2.28, "Fulfill", "purple", 1.55),
            feature_pill(9.35, 2.28, "Audit", "red", 1.55),
            tx(1.05, 3.58, 10.5, 0.62, "Multi-item requests, manager approvals, fulfillment permissions, cancellation, scan-to-fulfill, and request-level audit details.", 24, "text", True, align="c"),
            tx(2.15, 5.1, 8.0, 0.36, "This turns parts movement into a controlled workflow instead of a paper trail.", 17, "muted", align="c"),
        ],
    ))
    slides.append(SlideSpec(
        title="Barcode Scanning + Analytics",
        subtitle="Scanning makes warehouse work faster and gives managers visibility into real activity.",
        shapes=[
            box(0.9, 1.9, 3.2, 3.6, "panel", "line", True),
            tx(1.18, 2.23, 2.6, 0.35, "Scan Methods", 20, "amber", True, align="c"),
            tx(1.25, 2.95, 2.45, 1.45, "Camera scan\nUSB scanner\nManual SKU entry\nBarcode login", 18, "text", align="c"),
            box(5.05, 1.9, 3.2, 3.6, "panel", "line", True),
            tx(5.32, 2.23, 2.65, 0.35, "Scan Actions", 20, "green", True, align="c"),
            tx(5.45, 2.95, 2.35, 1.45, "Lookup parts\nNavigate records\nFulfill requests\nTrack success", 18, "text", align="c"),
            box(9.2, 1.9, 3.2, 3.6, "panel", "line", True),
            tx(9.47, 2.23, 2.65, 0.35, "Analytics", 20, "blue", True, align="c"),
            tx(9.52, 2.95, 2.55, 1.45, "Most scanned parts\nMost active users\nPeak scan hours\nScan frequency", 18, "text", align="c"),
        ],
    ))
    slides.append(SlideSpec(
        title="Operational Intelligence",
        subtitle="AutoTraQ does more than store inventory. It helps teams decide what needs attention.",
        shapes=[
            tx(0.85, 2.0, 2.8, 0.48, "Low-stock alerts", 25, "red", True),
            tx(0.88, 2.7, 3.0, 0.85, "Detect parts below minimum stock and surface them on the dashboard.", 17),
            tx(4.35, 2.0, 3.0, 0.48, "Reorder management", 25, "amber", True),
            tx(4.38, 2.7, 3.1, 0.85, "Prioritize critical, high, medium, and low reorder needs using usage history.", 17),
            tx(8.15, 2.0, 3.15, 0.48, "Predictive views", 25, "green", True),
            tx(8.18, 2.7, 3.2, 0.85, "Estimate days until restock, usage trends, and risk signals.", 17),
            box(1.12, 5.05, 10.9, 0.72, "panel2", "amber", True),
            tx(1.35, 5.27, 10.4, 0.26, "Managers see problems before they become stockouts.", 19, "text", True, align="c"),
        ],
    ))
    slides.append(SlideSpec(
        title="Admin, Security, and Accountability",
        subtitle="Every user gets the right access level, and important actions leave a record.",
        shapes=[
            box(0.85, 1.8, 3.0, 3.65, "panel", "line", True),
            tx(1.13, 2.12, 2.45, 0.35, "Roles", 21, "amber", True, align="c"),
            tx(1.18, 2.9, 2.35, 1.35, "Admin\nManager\nFulfillment\nViewer", 18, "text", align="c"),
            box(5.0, 1.8, 3.0, 3.65, "panel", "line", True),
            tx(5.27, 2.12, 2.45, 0.35, "Admin Console", 21, "blue", True, align="c"),
            tx(5.25, 2.9, 2.45, 1.35, "Create users\nReset passwords\nApprove roles\nManage pricing", 18, "text", align="c"),
            box(9.15, 1.8, 3.0, 3.65, "panel", "line", True),
            tx(9.42, 2.12, 2.45, 0.35, "Audit Trail", 21, "green", True, align="c"),
            tx(9.38, 2.9, 2.5, 1.35, "Who acted\nWhat changed\nWhen it happened\nWhich record", 18, "text", align="c"),
        ],
    ))
    slides.append(SlideSpec(
        title="Imports, Exports, and Reports",
        subtitle="The system supports real onboarding and real reporting needs.",
        shapes=[
            tx(1.0, 2.0, 3.0, 0.48, "CSV", 34, "amber", True),
            tx(1.0, 2.75, 3.5, 0.95, "Bulk import/update parts and export inventory data for handoff or analysis.", 18),
            tx(5.0, 2.0, 3.0, 0.48, "PDF", 34, "blue", True),
            tx(5.0, 2.75, 3.4, 0.95, "Generate full inventory and low-stock reports for managers.", 18),
            tx(9.0, 2.0, 3.0, 0.48, "API", 34, "green", True),
            tx(9.0, 2.75, 3.45, 0.95, "Backend routes cover parts, vehicles, inventory, requests, scans, reports, and admin workflows.", 18),
            tx(1.0, 5.35, 10.9, 0.35, "Useful in a demo, but also practical when a client brings existing spreadsheet data.", 18, "muted", align="c"),
        ],
    ))
    slides.append(SlideSpec(
        title="Technical Foundation",
        subtitle="Modern web stack, production deployment path, and automated quality checks.",
        shapes=[
            feature_pill(0.9, 1.95, "React + Vite + TypeScript", "blue", 3.0),
            feature_pill(4.05, 1.95, "Express API + Zod", "green", 2.55),
            feature_pill(6.8, 1.95, "MySQL + Prisma", "amber", 2.25),
            feature_pill(9.25, 1.95, "Railway Deploy", "purple", 2.25),
            box(1.2, 3.4, 10.7, 1.35, "panel", "line", True),
            tx(1.55, 3.82, 10.0, 0.35, "Production readiness includes security headers, compression, CORS controls, schema deployment, and CI checks.", 18, "text", True, align="c"),
            tx(2.0, 5.5, 9.2, 0.36, "This supports the web-only direction: reliable deploys instead of computer-by-computer installation.", 16, "muted", align="c"),
        ],
    ))
    slides.append(SlideSpec(
        title="Best Live Demo Path",
        subtitle="A short demo can show the whole product without overwhelming the room.",
        shapes=[
            tx(0.9, 1.95, 11.0, 0.4, "1  Login + dashboard", 18, "amber", True),
            tx(0.9, 2.55, 11.0, 0.4, "2  Search a part by SKU or vehicle fitment", 18, "text", True),
            tx(0.9, 3.15, 11.0, 0.4, "3  Open part detail: images, barcode, fitments, stock, pricing", 18, "text", True),
            tx(0.9, 3.75, 11.0, 0.4, "4  Scan or enter a barcode", 18, "text", True),
            tx(0.9, 4.35, 11.0, 0.4, "5  Create, approve, and fulfill a request", 18, "text", True),
            tx(0.9, 4.95, 11.0, 0.4, "6  Show inventory changed, then prove it in audit logs", 18, "text", True),
            tx(0.9, 5.55, 11.0, 0.4, "7  End on reorder management and low-stock intelligence", 18, "green", True),
        ],
    ))
    slides.append(SlideSpec(
        title="What AutoTraQ Proves",
        subtitle="This is not just a class project interface. It is a working operations platform.",
        shapes=[
            tx(1.05, 2.05, 10.8, 0.8, "One website can run the parts counter, warehouse, manager dashboard, scan station, and audit trail.", 30, "text", True, align="c"),
            Shape("rect", 2.25, 3.65, 8.8, 0.03, fill="amber", line="transparent"),
            tx(1.65, 4.3, 9.5, 0.65, "Client value: fewer missing parts, faster lookups, cleaner accountability, and simpler onboarding.", 23, "amber", True, align="c"),
            tx(4.85, 6.55, 3.6, 0.28, "AutoTraQ • Feature Showcase", 11, "muted", align="c"),
        ],
    ))
    return slides


def content_types(n: int) -> str:
    slide_overrides = "".join(
        f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(1, n + 1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
        '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
        '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
        f'{slide_overrides}</Types>'
    )


def presentation_xml(n: int) -> str:
    ids = "".join(f'<p:sldId id="{255 + i}" r:id="rId{i + 1}"/>' for i in range(1, n + 1))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
        f'<p:sldIdLst>{ids}</p:sldIdLst>'
        f'<p:sldSz cx="{SLIDE_W}" cy="{SLIDE_H}" type="wide"/>'
        '<p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle/></p:presentation>'
    )


def presentation_rels(n: int) -> str:
    rels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>']
    for i in range(1, n + 1):
        rels.append(f'<Relationship Id="rId{i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>')
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + "".join(rels) + "</Relationships>"


def static_parts(n: int) -> dict[str, str]:
    return {
        "[Content_Types].xml": content_types(n),
        "_rels/.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>',
        "docProps/core.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>AutoTraQ Feature Showcase</dc:title><dc:creator>AutoTraQ</dc:creator><cp:lastModifiedBy>AutoTraQ</cp:lastModifiedBy></cp:coreProperties>',
        "docProps/app.xml": f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>AutoTraQ</Application><PresentationFormat>On-screen Show (16:9)</PresentationFormat><Slides>{n}</Slides></Properties>',
        "ppt/presentation.xml": presentation_xml(n),
        "ppt/_rels/presentation.xml.rels": presentation_rels(n),
        "ppt/slideMasters/slideMaster1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>',
        "ppt/slideMasters/_rels/slideMaster1.xml.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>',
        "ppt/slideLayouts/slideLayout1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>',
        "ppt/slideLayouts/_rels/slideLayout1.xml.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>',
        "ppt/theme/theme1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="AutoTraQ"><a:themeElements><a:clrScheme name="AutoTraQ"><a:dk1><a:srgbClr val="0B1120"/></a:dk1><a:lt1><a:srgbClr val="F8FAFC"/></a:lt1><a:dk2><a:srgbClr val="111827"/></a:dk2><a:lt2><a:srgbClr val="E2E8F0"/></a:lt2><a:accent1><a:srgbClr val="F59E0B"/></a:accent1><a:accent2><a:srgbClr val="10B981"/></a:accent2><a:accent3><a:srgbClr val="38BDF8"/></a:accent3><a:accent4><a:srgbClr val="A78BFA"/></a:accent4><a:accent5><a:srgbClr val="EF4444"/></a:accent5><a:accent6><a:srgbClr val="22D3EE"/></a:accent6><a:hlink><a:srgbClr val="38BDF8"/></a:hlink><a:folHlink><a:srgbClr val="A78BFA"/></a:folHlink></a:clrScheme><a:fontScheme name="AutoTraQ"><a:majorFont><a:latin typeface="Aptos"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="AutoTraQ"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>',
    }


def write_pptx(slides: list[SlideSpec]) -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in static_parts(len(slides)).items():
            z.writestr(name, data)
        for i, spec in enumerate(slides, 1):
            z.writestr(f"ppt/slides/slide{i}.xml", slide_xml(spec))
            z.writestr(
                f"ppt/slides/_rels/slide{i}.xml.rels",
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
            )


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont, max_w: int) -> list[str]:
    lines: list[str] = []
    for para in text.split("\n"):
        if not para:
            lines.append("")
            continue
        words = para.split()
        current = ""
        for word in words:
            trial = f"{current} {word}".strip()
            if draw.textbbox((0, 0), trial, font=fnt)[2] <= max_w or not current:
                current = trial
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def draw_shape(draw: ImageDraw.ImageDraw, sh: Shape) -> None:
    x, y, w, h = px(sh.x), px(sh.y), px(sh.w), px(sh.h)
    fill = None if sh.fill == "transparent" else f"#{COLORS.get(sh.fill, sh.fill)}"
    line = None if sh.line == "transparent" else f"#{COLORS.get(sh.line, sh.line)}"
    if fill or line:
        if sh.radius:
            draw.rounded_rectangle([x, y, x + w, y + h], radius=16, fill=fill, outline=line, width=2)
        else:
            draw.rectangle([x, y, x + w, y + h], fill=fill, outline=line, width=2 if line else 0)
    if sh.text:
        fnt = font(int(sh.font_size * 1.38), sh.bold)
        color = f"#{COLORS.get(sh.color, sh.color)}"
        lines = wrap(draw, sh.text, fnt, w - 28)
        line_h = int(sh.font_size * 1.75)
        total_h = len(lines) * line_h
        ty = y + 12
        if sh.valign == "mid":
            ty = y + max(6, (h - total_h) // 2)
        for line_text in lines:
            tw = draw.textbbox((0, 0), line_text, font=fnt)[2]
            tx0 = x + 14
            if sh.align == "c":
                tx0 = x + (w - tw) // 2
            elif sh.align == "r":
                tx0 = x + w - tw - 14
            draw.text((tx0, ty), line_text, fill=color, font=fnt)
            ty += line_h


def render_previews(slides: list[SlideSpec]) -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    preview_paths = []
    for idx, spec in enumerate(slides, 1):
        img = Image.new("RGB", (PX_W, PX_H), f"#{COLORS['bg']}")
        draw = ImageDraw.Draw(img)
        all_shapes = [
            Shape("rect", 0, 0, W_IN, H_IN, fill="bg"),
            Shape("text", 0.58, 0.34, 2.4, 0.25, spec.eyebrow, font_size=9, bold=True, color="amber"),
            Shape("text", 0.58, 0.62, 7.7, 0.72, spec.title, font_size=30, bold=True, color="text"),
        ]
        if spec.subtitle:
            all_shapes.append(Shape("text", 0.62, 1.28, 8.4, 0.42, spec.subtitle, font_size=14, color="muted"))
        all_shapes += spec.shapes
        for sh in all_shapes:
            draw_shape(draw, sh)
        path = PREVIEW_DIR / f"slide_{idx:02d}.png"
        img.save(path)
        preview_paths.append(path)

    thumb_w, thumb_h = 400, 225
    rows = math.ceil(len(preview_paths) / 3)
    montage = Image.new("RGB", (thumb_w * 3, thumb_h * rows), "#020617")
    for i, p in enumerate(preview_paths):
        im = Image.open(p).resize((thumb_w, thumb_h))
        montage.paste(im, ((i % 3) * thumb_w, (i // 3) * thumb_h))
    montage.save(MONTAGE)


def inspect_previews() -> None:
    values = []
    for p in sorted(PREVIEW_DIR.glob("slide_*.png")):
        im = Image.open(p).convert("L")
        extrema = im.getextrema()
        values.append((p.name, extrema, len(set(list(im.resize((80, 45)).getdata())))))
    print(f"wrote {OUT}")
    print(f"previews {PREVIEW_DIR}")
    print(f"montage {MONTAGE}")
    for name, extrema, unique in values:
        print(f"{name}: extrema={extrema} unique_sample={unique}")


def main() -> None:
    slides = deck_specs()
    write_pptx(slides)
    render_previews(slides)
    inspect_previews()


if __name__ == "__main__":
    main()
