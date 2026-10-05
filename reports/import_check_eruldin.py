import bpy,json
from pathlib import Path
ROOT=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\design-pack\08-3d')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'models/eruldin-board-animated-v1.glb'))
s=bpy.context.scene
report={'imported_in_blender':bpy.app.version_string,'mesh_objects':sum(o.type=='MESH' for o in s.objects),'cameras':sum(o.type=='CAMERA' for o in s.objects),'lights':sum(o.type=='LIGHT' for o in s.objects),'objects_with_animation_data':sum(bool(o.animation_data) for o in s.objects),'actions':len(bpy.data.actions),'missing_external_images':sum(i.source=='FILE' and not i.packed_file for i in bpy.data.images),'game_engine_integration_tested':False}
(ROOT/'glb-import-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print('GLB_IMPORTED',json.dumps(report))
