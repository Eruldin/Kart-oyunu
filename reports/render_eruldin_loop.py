import bpy,json
from pathlib import Path
ROOT=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\design-pack\08-3d')
s=bpy.context.scene
s.render.engine='CYCLES';s.cycles.samples=8;s.cycles.use_denoising=True
s.render.resolution_x=640;s.render.resolution_y=400;s.render.resolution_percentage=100
frames=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\reports\3d-loop-frames');frames.mkdir(exist_ok=True)
s.render.image_settings.file_format='PNG'
for f in range(1,121,2):
    s.frame_set(f);s.render.filepath=str(frames/f'{f:03d}.png');bpy.ops.render.render(write_still=True)
print('RENDER_LOOP_DONE 60 frames 640x400, 5 second duration at 12fps')
