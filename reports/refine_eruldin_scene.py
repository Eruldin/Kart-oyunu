import bpy, math, json, random
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\design-pack\08-3d')
scene=bpy.context.scene
random.seed(53)
castle=bpy.data.collections['02_Castle']
environment=bpy.data.collections['06_Environment']
stone=bpy.data.materials['Weathered charcoal limestone']
stone2=bpy.data.materials['Lighter chipped stone']
iron=bpy.data.materials['Blackened iron']
bronze=bpy.data.materials['Patinated aged bronze']
gold=bpy.data.materials['Polished edge gold']
amber=bpy.data.materials['Emissive amber windows']
def put(o,name,col,material):
    o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o);o.data.materials.append(material)
    return o
def cube(name,loc,scale,mat):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=put(bpy.context.object,name,castle,mat);o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    m=o.modifiers.new('Soft chipped masonry edge','BEVEL');m.width=.012;m.segments=2
    return o
def bar(name,a,b,r,mat):
    a,b=Vector(a),Vector(b);v=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=v.length,location=(a+b)/2)
    o=put(bpy.context.object,name,castle,mat);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o
roofverts=[(-4,5.85,3.71),(-4,7.10,4.78),(-4,8.35,3.71),(4,5.85,3.71),(4,7.10,4.78),(4,8.35,3.71)]
mesh=bpy.data.meshes.new('Cathedral pitched roof mesh');mesh.from_pydata(roofverts,[],[(0,3,4,1),(1,4,5,2),(0,1,2),(3,5,4),(0,2,5,3)]);mesh.materials.append(iron)
o=bpy.data.objects.new('Cathedral real pitched roof',mesh);castle.objects.link(o)
for x in [-3.85,-3.1,-2.3,-1.55,-.78,0,.78,1.55,2.3,3.1,3.85]:
    bar('Roof bronze rib',(x,5.84,3.74),(x,7.1,4.8),.025,bronze)
    bar('Roof bronze back rib',(x,7.1,4.8),(x,8.37,3.74),.025,bronze)
bar('Cathedral roof ridge ornament',(-4,7.1,4.81),(4,7.1,4.81),.045,bronze)
for x in [-3.85,-2.3,0,2.3,3.85]:
    bar('Roof needle spire',(x,7.1,4.8),(x,7.1,5.32),.035,bronze)
for row in range(10):
    z=.74+row*.29
    for col in range(24):
        x=-3.78+col*.33+(row%2)*.15
        if abs(x)<.64 and z<2.72:continue
        if 1.68<z<3.27 and min(abs(x-v) for v in [-2.85,-1.75,-.6,.6,1.75,2.85])<.33:continue
        cube('Individual weathered front stone',(x,5.903,z),(.30,.025,.255),stone2 if random.random()<.22 else stone)
bpy.ops.mesh.primitive_torus_add(major_radius=.40,minor_radius=.058,major_segments=48,minor_segments=8,location=(0,5.69,3.08),rotation=(math.pi/2,0,0))
put(bpy.context.object,'Gothic rose window stone ring',castle,stone2)
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.345,depth=.035,location=(0,5.70,3.08),rotation=(math.pi/2,0,0))
put(bpy.context.object,'Rose window emissive glass',castle,amber)
for i in range(8):
    t=i*math.pi/4
    bar('Rose window radial tracery',(0,5.665,3.08),(.35*math.cos(t),5.665,3.08+.35*math.sin(t)),.019,iron)
for mname,alpha,strength in [('Fire amber shell',.28,2),('Fire golden core',.65,4),('Fire ivory tip',1,8)]:
    m=bpy.data.materials[mname];p=m.node_tree.nodes['Principled BSDF'];p.inputs['Alpha'].default_value=alpha;p.inputs['Emission Strength'].default_value=strength
    m.diffuse_color=tuple(p.inputs['Base Color'].default_value[:3])+(alpha,)
    if hasattr(m,'surface_render_method'):m.surface_render_method='DITHERED'
smoke=bpy.data.materials.new('Translucent 3D smoke wisps');smoke.use_nodes=True
p=smoke.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(.16,.19,.21,1);p.inputs['Alpha'].default_value=.065;p.inputs['Roughness'].default_value=1
if hasattr(smoke,'surface_render_method'):smoke.surface_render_method='DITHERED'
for i,(x,y) in enumerate([(-8.3,-4.35),(8.3,4.2)]):
    verts=[];faces=[]
    for j in range(14):
        t=j/13;rad=.12+.12*t
        for k in range(12):
            a=k*math.pi/6;verts.append((math.sin(t*5)*.18+rad*math.cos(a),math.cos(t*3)*.12+rad*math.sin(a),t*2.5))
    for j in range(13):
        for k in range(12):
            a=j*12+k;b=j*12+(k+1)%12;faces.append((a,b,b+12,a+12))
    mesh=bpy.data.meshes.new('Smoke tubular mesh');mesh.from_pydata(verts,[],faces);mesh.materials.append(smoke)
    o=bpy.data.objects.new(f'Brazier {i} 3D smoke wisp',mesh);environment.objects.link(o);o.location=(x,y,1.75)
    for f in [1,31,61,91,121]:
        angle=(f-1)*math.pi/60;o.rotation_euler[2]=math.sin(angle)*.3;o.scale=(1+.12*math.sin(angle),1+.12*math.cos(angle),1+.12*math.sin(angle));o.keyframe_insert(data_path='rotation_euler',frame=f);o.keyframe_insert(data_path='scale',frame=f)
scene.camera.data.ortho_scale=32
scene.camera.location=(10,-17,22)
scene.camera.rotation_euler=(Vector((0,1.8,1.2))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.use_nodes=True
nodes=scene.node_tree.nodes;nodes.clear();layers=nodes.new('CompositorNodeRLayers');glare=nodes.new('CompositorNodeGlare');glare.glare_type='FOG_GLOW';glare.quality='MEDIUM';glare.threshold=1.3;glare.size=7
out=nodes.new('CompositorNodeComposite');scene.node_tree.links.new(layers.outputs['Image'],glare.inputs['Image']);scene.node_tree.links.new(glare.outputs['Image'],out.inputs['Image'])
scene.frame_set(1)
scene['Not final']='Original detailed blockout; further sculpt, hand-painted PBR, silhouette and optimization work remains. No fluid simulation.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'eruldin-korvengrad-board-v1.blend'))
scene.render.filepath=str(ROOT/'previews/board-camera-frame001.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'models/eruldin-board-animated-v1.glb'),export_format='GLB',export_apply=True,export_animations=True,export_lights=True,export_cameras=True,export_extras=True)
for name,filename in [('01_Board','board-surface-v1.glb'),('02_Castle','korvengrad-castle-v1.glb'),('03_Candles','candle-clusters-v1.glb'),('04_Braziers','brazier-assembly-v1.glb')]:
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.collections[name].objects:
        if o.type=='MESH':o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'models'/filename),export_format='GLB',use_selection=True,export_apply=True,export_animations=True,export_extras=True)
summary={'blender':bpy.app.version_string,'objects':len(scene.objects),'meshes':sum(o.type=='MESH' for o in scene.objects),'lights':sum(o.type=='LIGHT' for o in scene.objects),'animated_objects':sum(bool(o.animation_data) for o in scene.objects),'animated_light_data':sum(o.type=='LIGHT' and bool(o.data.animation_data) for o in scene.objects),'materials':len(bpy.data.materials),'fps':24,'frame_start':1,'frame_end':120,'collections':{c.name:len(c.objects) for c in scene.collection.children},'limitations':['Detailed blockout, not final sculpt or hand-painted production model','No Mantaflow fluid fire/smoke simulation; fire and smoke are animated 3D mesh layers','GLB simplifies Blender-only procedural bump/compositor and light-intensity animation','Standalone GLB subsets preserve assembly positions; origin preparation and LOD are not complete']}
(ROOT/'scene-inventory.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print('ERULDIN_REFINED',json.dumps(summary))
