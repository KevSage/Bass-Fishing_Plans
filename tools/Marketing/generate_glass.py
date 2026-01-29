import os
from PIL import Image, ImageOps, ImageFilter, ImageDraw

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, "inputs")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

# --- VISUAL SETTINGS (The "Retina" Polish) ---
GLASS_OPACITY = 195     
BORDER_OPACITY = 220    # Bumped slightly for crispness
SHADOW_OPACITY = 110    

# --- GEOMETRY SETTINGS ---
# 0.03 is the sweet spot. 0.035 was slightly too aggressive for some text.
TILT_FACTOR = 0.030     

# --- QUALITY SETTINGS (NEW) ---
# We process everything at 3x resolution and downscale.
# This eliminates the "jagged/warped" border lines.
SUPER_SAMPLE = 3.0      

def ensure_dirs():
    if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)
    if not os.path.exists(INPUT_DIR): os.makedirs(INPUT_DIR)

def _iround(x): return int(round(x))

def load_image(path):
    try:
        img = Image.open(path)
        img = ImageOps.exif_transpose(img) 
        return img.convert("RGBA")
    except Exception as e:
        print(f"❌ Error loading {path}: {e}")
        return None

def apply_perspective_tilt(img, tilt_factor=TILT_FACTOR):
    """
    Applies the tilt. Because 'img' is now super-sized, 
    the transformation will be incredibly smooth.
    """
    w, h = img.size
    pinch = h * tilt_factor

    quad = (
        0, pinch,           # TL
        0, h - pinch,       # BL
        w, h,               # BR
        w, 0                # TR
    )
    
    return img.transform(img.size, Image.QUAD, quad, resample=Image.Resampling.BICUBIC)

def create_flat_glass_card(img_path, target_width_final):
    img = load_image(img_path)
    if not img: return None

    # 1. UPSCALING (The Secret Sauce)
    # We do all work at 3x the size to fix aliasing
    target_width_hd = int(target_width_final * SUPER_SAMPLE)

    # Smart Crop (Standard)
    w, h = img.size
    box = (_iround(w * 0.02), _iround(h * 0.02), _iround(w * 0.98), _iround(h * 0.98))
    card = img.crop(box)

    # Resize to HD working size
    aspect = card.height / max(1, card.width)
    target_height_hd = int(target_width_hd * aspect)
    card = card.resize((target_width_hd, target_height_hd), Image.Resampling.LANCZOS)

    # Glass Transparency
    r, g, b, a = card.split()
    a = a.point(lambda p: int(p * (GLASS_OPACITY / 255)))
    card = Image.merge("RGBA", (r, g, b, a))

    # SCALED Radius & Border
    # We must scale these up so they look correct when shrunk down
    radius_hd = int(30 * SUPER_SAMPLE)
    border_hd = int(1 * SUPER_SAMPLE) # 1px becomes 3px physically, then 1px visually

    # Mask
    mask = Image.new("L", card.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), card.size], radius=radius_hd, fill=255)
    
    final = Image.new("RGBA", card.size, (0,0,0,0))
    final.paste(card, (0, 0), mask)
    
    # Border
    border = Image.new("RGBA", card.size, (0,0,0,0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle(
        [(0,0), (card.width-1, card.height-1)], 
        radius=radius_hd, 
        outline=(255,255,255,BORDER_OPACITY), 
        width=border_hd
    )
    
    return Image.alpha_composite(final, border)

def create_shadow_layer(card_img):
    w, h = card_img.size
    radius_hd = int(30 * SUPER_SAMPLE)
    
    shadow = Image.new("RGBA", (w, h), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    
    # Offset needs to be scaled too
    offset = int(4 * SUPER_SAMPLE)
    sd.rounded_rectangle(
        [(offset, offset), (w-offset, h-offset)], 
        radius=radius_hd, 
        fill=(0,0,0,SHADOW_OPACITY)
    )
    
    # Blur needs to be scaled
    blur_amount = 15 * (SUPER_SAMPLE / 1.5) 
    return shadow.filter(ImageFilter.GaussianBlur(blur_amount))

# --- GENERATORS ---

def generate_video_overlay(ui_filename):
    """MODE A: Transparent Video Asset"""
    ensure_dirs()
    input_path = os.path.join(INPUT_DIR, ui_filename)
    
    # Video 4K Width = 700px. Logic: 700 * 3 = 2100px processing
    target_width_final = 700
    
    flat_card_hd = create_flat_glass_card(input_path, target_width_final)
    if not flat_card_hd: return

    # Canvas
    margin = int(50 * SUPER_SAMPLE)
    cw, ch = flat_card_hd.width + margin, flat_card_hd.height + margin
    canvas = Image.new("RGBA", (cw, ch), (0,0,0,0))
    
    shadow = create_shadow_layer(flat_card_hd)
    
    # Offsets
    off_x = margin//2 + int(5 * SUPER_SAMPLE)
    off_y = margin//2 + int(10 * SUPER_SAMPLE)
    
    canvas.paste(shadow, (off_x, off_y), shadow)
    canvas.paste(flat_card_hd, (margin//2, margin//2), flat_card_hd)

    # Apply Tilt at HD
    tilted_hd = apply_perspective_tilt(canvas, tilt_factor=TILT_FACTOR)
    
    # DOWNSCALE (This is where the magic smoothing happens)
    final_w = int(tilted_hd.width / SUPER_SAMPLE)
    final_h = int(tilted_hd.height / SUPER_SAMPLE)
    final_asset = tilted_hd.resize((final_w, final_h), Image.Resampling.LANCZOS)

    out_name = f"VIDEO_OVL_{ui_filename.split('.')[0]}.png"
    final_asset.save(os.path.join(OUTPUT_DIR, out_name), "PNG")
    print(f"✅ Video Asset Created: {out_name}")

def generate_social_ad(hero_filename, ui_filename):
    """MODE B: Social Media Composite"""
    ensure_dirs()
    hero_path = os.path.join(INPUT_DIR, hero_filename)
    ui_path = os.path.join(INPUT_DIR, ui_filename)

    hero = load_image(hero_path)
    if not hero: return

    # Background (4:5 Crop)
    target_w, target_h = 1080, 1350
    aspect = hero.width / hero.height
    if aspect > (4/5):
        new_w = int(hero.height * (4/5))
        offset = (hero.width - new_w) // 2
        hero = hero.crop((offset, 0, offset + new_w, hero.height))
    hero = hero.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Create Card (HD)
    card_w_final = int(target_w * 0.38) # 45% width
    flat_card_hd = create_flat_glass_card(ui_path, card_w_final)
    if not flat_card_hd: return
    
    # Composite (HD)
    margin = int(60 * SUPER_SAMPLE)
    cw, ch = flat_card_hd.width + margin, flat_card_hd.height + margin
    canvas = Image.new("RGBA", (cw, ch), (0,0,0,0))
    
    shadow = create_shadow_layer(flat_card_hd)
    off_x = margin//2 + int(5 * SUPER_SAMPLE)
    off_y = margin//2 + int(10 * SUPER_SAMPLE)
    
    canvas.paste(shadow, (off_x, off_y), shadow)
    canvas.paste(flat_card_hd, (margin//2, margin//2), flat_card_hd)

    tilted_hd = apply_perspective_tilt(canvas, tilt_factor=TILT_FACTOR)

    # Downscale UI before pasting
    final_ui_w = int(tilted_hd.width / SUPER_SAMPLE)
    final_ui_h = int(tilted_hd.height / SUPER_SAMPLE)
    tilted_ui = tilted_hd.resize((final_ui_w, final_ui_h), Image.Resampling.LANCZOS)

    # Position
    pos_x = int(target_w * 0.06) 
    pos_y = int(target_h * 0.10) 
    
    hero.paste(tilted_ui, (pos_x, pos_y), tilted_ui)

    out_name = f"AD_FINAL_{ui_filename.split('.')[0]}.png"
    hero.convert("RGB").save(os.path.join(OUTPUT_DIR, out_name), quality=95)
    print(f"✅ Social Ad Created: {out_name}")

if __name__ == "__main__":
    # UNCOMMENT THE ONE YOU WANT TO RUN:
    
    # generate_video_overlay("weather_screenshot.png")
    generate_social_ad("hero.jpeg", "lure.jpeg")
    
    print("🚀 Retina Script Finished.")