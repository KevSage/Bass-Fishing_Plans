# apps/api/app/services/pdf_generator.py
"""
PDF generation for bass fishing plans.
Generates mobile-optimized dark theme and A4 printable versions.

Note: This returns styled HTML. For true PDFs, you'll need to:
1. Use a library like WeasyPrint or ReportLab (server-side)
2. Or let frontend convert HTML to PDF (client-side with jsPDF or print-to-PDF)

For MVP, returning styled HTML that can be saved/printed is often sufficient.
"""
from typing import Dict, Any


def generate_mobile_dark_html(plan_data: Dict[str, Any]) -> str:
    """
    Generate mobile-optimized dark theme HTML.
    
    Design for:
    - On-the-water viewing (high contrast, large text)
    - Dark background (battery saving, night fishing)
    - Portrait orientation
    """
    conditions = plan_data.get("conditions", {})
    location = conditions.get("location_name", "")
    temp_low = conditions.get("temp_low", 50)
    temp_high = conditions.get("temp_high", 60)
    wind = conditions.get("wind_speed", 0)
    sky = conditions.get("sky_condition", "")
    
    outlook = plan_data.get("outlook_blurb", "")
    primary = plan_data.get("primary_technique", "")
    lure = plan_data.get("featured_lure_name", "")
    colors = ", ".join(plan_data.get("color_recommendations", []))
    targets = plan_data.get("recommended_targets", [])
    tips = plan_data.get("strategy_tips", [])
    day_prog = plan_data.get("day_progression", [])
    
    is_member = plan_data.get("conditions", {}).get("subscriber_email") is not None
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bass Plan - {location}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            background: #1a1a1a;
            color: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            line-height: 1.6;
        }}
        .header {{
            border-bottom: 3px solid #2c5f2d;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }}
        h1 {{
            color: #4CAF50;
            font-size: 24px;
            margin-bottom: 8px;
        }}
        .conditions {{
            color: #888;
            font-size: 16px;
            margin-bottom: 8px;
        }}
        .outlook {{
            background: #2a2a2a;
            padding: 15px;
            border-left: 4px solid #4CAF50;
            margin: 20px 0;
            font-size: 15px;
        }}
        h2 {{
            color: #4CAF50;
            font-size: 20px;
            margin: 25px 0 12px 0;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
        }}
        .lure-box {{
            background: #2a2a2a;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }}
        .lure-name {{
            color: #4CAF50;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
        }}
        .lure-colors {{
            color: #888;
            font-size: 14px;
        }}
        .targets {{
            list-style: none;
            margin: 10px 0;
        }}
        .targets li {{
            padding: 8px 0;
            border-bottom: 1px solid #333;
            font-size: 15px;
        }}
        .targets li:last-child {{
            border-bottom: none;
        }}
        .tips {{
            margin: 10px 0;
        }}
        .tips li {{
            margin: 10px 0;
            padding-left: 20px;
            font-size: 15px;
        }}
        .day-prog {{
            background: #2a2a2a;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }}
        .day-prog p {{
            margin: 12px 0;
            font-size: 15px;
            line-height: 1.7;
        }}
        .day-prog strong {{
            color: #4CAF50;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #333;
            color: #666;
            font-size: 13px;
            text-align: center;
        }}
        @media print {{
            body {{
                background: #1a1a1a;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{location}</h1>
        <div class="conditions">
            {temp_low}-{temp_high}°F • {wind} mph wind • {sky}
        </div>
    </div>
    
    <div class="outlook">
        {outlook}
    </div>
    
    <h2>Pattern 1 — {primary}</h2>
    
    <div class="lure-box">
        <div class="lure-name">{lure}</div>
        <div class="lure-colors">Colors: {colors}</div>
    </div>
    
    <h2>Targets</h2>
    <ul class="targets">
        {"".join(f"<li>• {target}</li>" for target in targets)}
    </ul>
    
    <h2>How to Fish It</h2>
    <ul class="tips">
        {"".join(f"<li>{tip}</li>" for tip in tips)}
    </ul>
    
    <h2>Day Progression</h2>
    <div class="day-prog">
        {"".join(f"<p>{line}</p>" for line in day_prog)}
    </div>
    
    <div class="footer">
        {"Member Plan" if is_member else "Preview Plan"} • BassClarity.com
    </div>
</body>
</html>
    """
    
    return html


def generate_a4_printable_html(plan_data: Dict[str, Any]) -> str:
    """
    Generate A4 printable HTML (light theme for ink efficiency).
    
    Design for:
    - Printing on standard paper
    - Light background, dark text
    - High readability
    - Fits on 1-2 pages
    """
    conditions = plan_data.get("conditions", {})
    location = conditions.get("location_name", "")
    temp_low = conditions.get("temp_low", 50)
    temp_high = conditions.get("temp_high", 60)
    wind = conditions.get("wind_speed", 0)
    sky = conditions.get("sky_condition", "")
    date = conditions.get("trip_date", "")
    
    outlook = plan_data.get("outlook_blurb", "")
    primary = plan_data.get("primary_technique", "")
    lure = plan_data.get("featured_lure_name", "")
    colors = ", ".join(plan_data.get("color_recommendations", []))
    targets = plan_data.get("recommended_targets", [])
    tips = plan_data.get("strategy_tips", [])
    day_prog = plan_data.get("day_progression", [])
    
    is_member = plan_data.get("conditions", {}).get("subscriber_email") is not None
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bass Fishing Plan - {location}</title>
    <style>
        @page {{
            size: A4;
            margin: 1.5cm;
        }}
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #000;
            line-height: 1.5;
            font-size: 11pt;
        }}
        .header {{
            border-bottom: 3px solid #2c5f2d;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }}
        h1 {{
            font-size: 22pt;
            color: #2c5f2d;
            margin-bottom: 5px;
        }}
        .meta {{
            font-size: 10pt;
            color: #666;
        }}
        .outlook {{
            background: #f5f5f5;
            padding: 12px;
            border-left: 4px solid #2c5f2d;
            margin: 15px 0;
            font-size: 10pt;
        }}
        h2 {{
            font-size: 14pt;
            color: #2c5f2d;
            margin: 18px 0 8px 0;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
        }}
        .lure-box {{
            background: #f9f9f9;
            padding: 10px;
            border: 1px solid #ddd;
            margin: 10px 0;
        }}
        .lure-name {{
            font-size: 13pt;
            font-weight: bold;
            color: #2c5f2d;
        }}
        .lure-colors {{
            font-size: 10pt;
            color: #666;
            margin-top: 3px;
        }}
        .targets {{
            columns: 2;
            column-gap: 20px;
            list-style: none;
            margin: 8px 0;
        }}
        .targets li {{
            break-inside: avoid;
            padding: 4px 0;
            font-size: 10pt;
        }}
        .tips {{
            margin: 8px 0;
        }}
        .tips li {{
            margin: 6px 0;
            padding-left: 15px;
            font-size: 10pt;
        }}
        .day-prog {{
            margin: 10px 0;
        }}
        .day-prog p {{
            margin: 8px 0;
            font-size: 10pt;
        }}
        .day-prog strong {{
            color: #2c5f2d;
        }}
        .footer {{
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #999;
            text-align: center;
        }}
        @media print {{
            body {{
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Bass Fishing Plan</h1>
        <div class="meta">
            <strong>{location}</strong> • {date} • {temp_low}-{temp_high}°F, {wind} mph wind, {sky}
        </div>
    </div>
    
    <div class="outlook">
        <strong>Outlook:</strong> {outlook}
    </div>
    
    <h2>Pattern 1 — {primary}</h2>
    
    <div class="lure-box">
        <div class="lure-name">{lure}</div>
        <div class="lure-colors">Colors: {colors}</div>
    </div>
    
    <h2>Targets</h2>
    <ul class="targets">
        {"".join(f"<li>• {target}</li>" for target in targets)}
    </ul>
    
    <h2>How to Fish It</h2>
    <ul class="tips">
        {"".join(f"<li>{tip}</li>" for tip in tips)}
    </ul>
    
    <h2>Day Progression</h2>
    <div class="day-prog">
        {"".join(f"<p>{line}</p>" for line in day_prog)}
    </div>
    
    <div class="footer">
        {"Member Plan" if is_member else "Preview Plan"} • BassClarity.com • Tight Lines!
    </div>
</body>
</html>
    """
    
    return html