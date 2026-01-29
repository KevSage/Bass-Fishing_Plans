import os
import numpy as np
from PIL import Image, ImageOps, ImageFilter, ImageDraw

# --- 🩹 MONKEY PATCH FOR PILLOW 10+ ---
if not hasattr(Image, 'ANTIALIAS'):
    Image.ANTIALIAS = Image.LANCZOS
# ---------------------------------------

from moviepy.editor import VideoFileClip, VideoClip

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, "inputs")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

# --- 🎬 TIMELINE ---
BG_FILENAME = "kayak_pov.mp4"
BG_START_TRIM = 0 

# AVAILABLE POSITIONS: "top-left", "top-center", "top-right", "bottom-left", "bottom-right", "center"
OVERLAYS = [
    {
        "file": "hud_display.mp4",
        "start_time": 5,
        "duration": 10,
        "scale": 0.32,        # Reduced by 25% (Was 0.50)
        "position": "top-right" # <--- Change this to move the HUD!
    }
]

# --- VISUAL SETTINGS ---
GLASS_OPACITY = 220      
BORDER_OPACITY = 255     
SHADOW_OPACITY = 160     
SUPER_SAMPLE = 2.0       
ANIMATION_SPEED = 0.4    
EDGE_PADDING = 60        # Pixel distance from the edge of the screen

# ---------------------------
# --- CORE ENGINE ---
# ---------------------------

def ensure_dirs():
    if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)

def create_glass_assets(w, h):
    """Generates the Mask, Border, and Shadow assets."""
    hd_w, hd_h = int(w * SUPER_SAMPLE), int(h * SUPER_SAMPLE)
    radius = 20 * SUPER_SAMPLE 
    
    mask = Image.new("L", (hd_w, hd_h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0,0), (hd_w,hd_h)], radius=radius, fill=255)
    
    border = Image.new("RGBA", (hd_w, hd_h), (0,0,0,0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle([(0,0), (hd_w-1,hd_h-1)], radius=radius, outline=(255,255,255,BORDER_OPACITY), width=int(3*SUPER_SAMPLE))
    
    shadow = Image.new("RGBA", (hd_w, hd_h), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([(0, 10*SUPER_SAMPLE), (hd_w, hd_h+10*SUPER_SAMPLE)], radius=radius, fill=(0,0,0,SHADOW_OPACITY))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20*SUPER_SAMPLE))
    
    return mask, border, shadow

def render_glass_composite(hud_frame, w, h, assets):
    """Renders the glass sticker."""
    img = Image.fromarray(hud_frame).convert("RGBA")
    
    hd_w, hd_h = int(w * SUPER_SAMPLE), int(h * SUPER_SAMPLE)
    img = img.resize((hd_w, hd_h), Image.Resampling.LANCZOS)
    
    mask, border, shadow = assets
    
    r, g, b, a = img.split()
    a = a.point(lambda p: int(p * (GLASS_OPACITY / 255)))
    img = Image.merge("RGBA", (r, g, b, a))
    
    content = Image.new("RGBA", img.size, (0,0,0,0))
    content.paste(img, (0,0), mask)
    
    margin = int(60 * SUPER_SAMPLE)
    canvas = Image.new("RGBA", (hd_w + margin, hd_h + margin), (0,0,0,0))
    
    offset_x = margin // 2
    offset_y = margin // 2
    
    canvas.paste(shadow, (offset_x, offset_y), shadow)
    canvas.paste(content, (offset_x, offset_y), content)
    canvas.paste(border, (offset_x, offset_y), border)
    
    return canvas

def get_position_coords(pos_name, bg_w, bg_h, item_w, item_h):
    """Calculates X,Y coordinates based on position name."""
    padding = EDGE_PADDING
    
    if pos_name == "top-left":
        return (padding, padding)
    elif pos_name == "top-center":
        return ((bg_w - item_w) // 2, padding)
    elif pos_name == "top-right":
        return (bg_w - item_w - padding, padding)
    elif pos_name == "bottom-left":
        return (padding, bg_h - item_h - padding)
    elif pos_name == "bottom-right":
        return (bg_w - item_w - padding, bg_h - item_h - padding)
    else: # Center
        return ((bg_w - item_w) // 2, (bg_h - item_h) // 2)

def render_timeline():
    ensure_dirs()
    print("🎬 Loading Assets...")
    
    bg_clip = VideoFileClip(os.path.join(INPUT_DIR, BG_FILENAME))
    if BG_START_TRIM > 0:
        bg_clip = bg_clip.subclip(BG_START_TRIM)

    overlay_data = []
    for item in OVERLAYS:
        path = os.path.join(INPUT_DIR, item["file"])
        if not os.path.exists(path):
            print(f"❌ Missing file: {item['file']}")
            continue
            
        clip = VideoFileClip(path)
        
        target_w = int(bg_clip.w * item["scale"])
        target_h = int(target_w * (clip.h / clip.w))
        
        assets = create_glass_assets(target_w, target_h)
        clip_resized = clip.resize(width=target_w)
        
        overlay_data.append({
            "clip": clip_resized,
            "config": item,
            "w": target_w,
            "h": target_h,
            "assets": assets
        })

    print("⚙️  Starting Compositor Engine...")

    def make_frame(t):
        if t >= bg_clip.duration: return bg_clip.get_frame(bg_clip.duration - 0.1)
        bg_frame = bg_clip.get_frame(t)
        final_canvas = Image.fromarray(bg_frame).convert("RGBA")
        
        for data in overlay_data:
            conf = data["config"]
            start = conf["start_time"]
            end = start + conf["duration"]
            
            if start <= t < end:
                hud_t = t - start
                if hud_t >= data["clip"].duration: hud_t = hud_t % data["clip"].duration
                
                hud_frame = data["clip"].get_frame(hud_t)
                glass_hd = render_glass_composite(hud_frame, data["w"], data["h"], data["assets"])
                
                # Animation: Zoom In
                scale = 1.0
                if hud_t < ANIMATION_SPEED:
                    progress = hud_t / ANIMATION_SPEED
                    s = 1.70158
                    p = progress - 1
                    scale = (p * p * ((s + 1) * p + s) + 1)
                    if scale < 0.1: scale = 0.1

                final_w = int((glass_hd.width / SUPER_SAMPLE) * scale)
                final_h = int((glass_hd.height / SUPER_SAMPLE) * scale)
                
                glass_final = glass_hd.resize((final_w, final_h), Image.Resampling.LANCZOS)
                
                # POSITION LOGIC
                # We calculate position based on the FINAL animated size to keep it anchored
                pos_name = conf.get("position", "center")
                
                # For "Center" positions, we want the anchor to be the middle of the object
                # For "Corner" positions, we want the anchor to be the corner
                base_x, base_y = get_position_coords(pos_name, final_canvas.width, final_canvas.height, final_w, final_h)
                
                final_canvas.alpha_composite(glass_final, (base_x, base_y))
        
        return np.array(final_canvas.convert("RGB"))

    final_video = VideoClip(make_frame, duration=bg_clip.duration)
    
    output_name = "FINAL_POSITIONED_RENDER.mp4"
    print(f"🚀 Rendering to {output_name}...")
    
    final_video.write_videofile(
        os.path.join(OUTPUT_DIR, output_name),
        fps=30,
        codec='libx264',
        audio_codec='aac',
        preset='medium'
    )

if __name__ == "__main__":
    render_timeline()