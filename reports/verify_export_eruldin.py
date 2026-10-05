import bpy,json
from pathlib import Path
ROOT=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\design-pack\08-3d')
s=bpy.context.scene
def snapshot(frame):
    s.frame_set(frame);bpy.context.view_layer.update()
    return {o.name:[v for row in o.matrix_world for v in row]+([o.data.energy] if o.type=='LIGHT' else []) for o in s.objects}
a,b,peak=snapshot(1),snapshot(121),snapshot(61)
loop=max(abs(x-y) for name in a for x,y in zip(a[name],b[name]))
changed=sum(any(abs(x-y)>1e-4 for x,y in zip(a[name],peak[name])) for name in a)
s.frame_set(1);s.frame_end=121
bpy.ops.export_scene.gltf(filepath=str(ROOT/'models/eruldin-board-animated-v1.glb'),export_format='GLB',export_apply=True,export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_lights=True,export_cameras=True,export_extras=True)
report={'loop_frame1_vs121_max_transform_or_light_delta':loop,'objects_changed_at_frame61':changed,'render_range':[1,120],'loop_duplicate_key':121,'fps':24,'glb_export_animation_mode':'ACTIVE_ACTIONS','game_integration_tested':False}
(ROOT/'animation-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('ANIMATION_VALIDATED',json.dumps(report))
