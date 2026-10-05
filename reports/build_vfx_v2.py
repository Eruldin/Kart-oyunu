import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\design-pack\06-vfx')
OUT=ROOT/'animated-v2';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=8;s.cycles.use_denoising=True
s.render.resolution_x=640;s.render.resolution_y=640;s.render.resolution_percentage=100
s.render.fps=24;s.frame_start=1;s.frame_end=37;s.render.film_transparent=True
s.world.color=(0,0,0);s.view_settings.view_transform='Standard'
names=['summon-amber','impact-silver','heal-gold-green','white-echo','karah-ink','victory-shards']
colors=[(1,.55,.12),(.6,.8,1),(.45,1,.6),(.85,.93,1),(.5,.2,.75),(1,.75,.25)]
records=[]
def attach(o,collection):
    for old in list(o.users_collection):old.objects.unlink(o)
    collection.objects.link(o)
for i,(name,color) in enumerate(zip(names,colors)):
    random.seed(710+i)
    col=bpy.data.collections.new(name);s.collection.children.link(col)
    root=bpy.data.objects.new(name+'_anchor',None);col.objects.link(root)
    root['asset_kind']='animated transparent billboard and mesh motes'
    root['fade_note']='GLB exports transforms; final alpha envelope is in event-timelines JSON'
    mat=bpy.data.materials.new(name+'_rgba');mat.use_nodes=True
    p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=1
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/f'{name}-texture-v1.png'))
    mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
    mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=1
    mat.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha'])
    mat.surface_render_method='DITHERED';mat.use_backface_culling=False
    bpy.ops.mesh.primitive_plane_add(size=4,location=(0,0,0));o=bpy.context.object
    o.name=name+'_billboard';attach(o,col);o.parent=root;o.data.materials.append(mat)
    for frame,scale,rot in [(1,.001,-.1),(5,.35,-.05),(10,1,0),(24,1.15,.05),(37,.001,.1)]:
        o.scale=(scale,scale,scale);o.rotation_euler[2]=rot
        o.keyframe_insert('scale',frame=frame);o.keyframe_insert('rotation_euler',frame=frame)
    shardmat=bpy.data.materials.new(name+'_mote');shardmat.use_nodes=True
    p=shardmat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=2
    for j in range(10):
        ang=2*math.pi*j/10+random.uniform(-.1,.1)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.035)
        dot=bpy.context.object;dot.name=f'{name}_mote_{j:02}';attach(dot,col);dot.parent=root;dot.data.materials.append(shardmat)
        for frame,radius,scale in [(1,.1,.001),(9,.4,.8),(20,1.4,1),(37,2.1,.001)]:
            dot.location=(math.cos(ang)*radius,math.sin(ang)*radius,.1+random.uniform(0,.08))
            dot.scale=(scale,scale*1.8,scale)
            dot.keyframe_insert('location',frame=frame);dot.keyframe_insert('scale',frame=frame)
    s.frame_set(1)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in col.objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=o
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{name}.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_extras=True,export_image_format='AUTO')
    records.append({'clip':f'{name}.glb','duration_s':1.5,'billboard_planes':1,'animated_mesh_motes':10,'loop':False,'transparent_texture':f'../{name}-texture-v1.png','technique':'Transform keyframes on textured quad + ten emissive mesh motes; not a fluid simulation or temporal flipbook'})
    col.hide_render=True
bpy.ops.object.camera_add(location=(0,0,6));cam=bpy.context.object;cam.rotation_euler=(0,0,0)
cam.data.type='ORTHO';cam.data.ortho_scale=5.3;s.camera=cam
for col in list(s.collection.children):col.hide_render=(col.name!='white-echo')
root=s.collection.children.get('white-echo')
s.frame_set(12);s.render.filepath=str(OUT/'white-echo-peak.png');bpy.ops.render.render(write_still=True)
teximgs=[im for im in bpy.data.images if im.source=='FILE']
for im in teximgs:im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'eruldin-card-vfx-v2.blend'))
frames=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\reports\vfx-preview-frames');frames.mkdir(exist_ok=True)
for frame in range(1,37,2):
    s.frame_set(frame);s.render.filepath=str(frames/f'{frame:03}.png');bpy.ops.render.render(write_still=True)
(OUT/'clip-specifications.json').write_text(json.dumps({'date':'2026-10-06','clips':records,'validation':'Exported actual transform animations; engine/event playback and shader polish not tested'},indent=2),encoding='utf-8')
print('VFX_EXPORT_COMPLETE',len(records))
