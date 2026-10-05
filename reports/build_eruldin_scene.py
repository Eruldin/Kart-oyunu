import bpy, math, random, json
from pathlib import Path
from mathutils import Vector

ROOT=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\design-pack\08-3d')
random.seed(41)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=1600
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.render.fps=24
scene.frame_start=1
scene.frame_end=120
scene.world.color=(.018,.028,.038)
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.026,.048,.066,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.27
scene.view_settings.view_transform='AgX'
COLS={}
for name in ['01_Board','02_Castle','03_Candles','04_Braziers','05_AnimatedFire','06_Environment','07_Lights','08_Cameras']:
    c=bpy.data.collections.new(name);scene.collection.children.link(c);COLS[name]=c
active='01_Board'

def put(o,name,material=None):
    o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    COLS[active].objects.link(o)
    if material:o.data.materials.append(material)
    return o

def mat(name,color,metal=0,rough=.65,emission=0,noise=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1)
        p.inputs['Emission Strength'].default_value=emission
    if noise:
        tex=m.node_tree.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=18
        tex.inputs['Detail'].default_value=3
        bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=noise;bump.inputs['Distance'].default_value=.045
        m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m

stone=mat('Weathered charcoal limestone',(.11,.145,.16),rough=.86,noise=.38)
stone2=mat('Lighter chipped stone',(.18,.215,.21),rough=.85,noise=.32)
slate=mat('Evergreen playing slate',(.045,.095,.075),rough=.62,noise=.12)
bronze=mat('Patinated aged bronze',(.31,.205,.078),metal=.78,rough=.37,noise=.13)
gold=mat('Polished edge gold',(.58,.36,.105),metal=.8,rough=.3)
wood=mat('Dark walnut',(.071,.034,.02),rough=.67,noise=.25)
iron=mat('Blackened iron',(.034,.041,.046),metal=.8,rough=.47)
wax=mat('Warm ivory wax',(.73,.57,.31),rough=.6,noise=.12)
wick=mat('Charred wick',(.012,.009,.006),rough=.95)
amber=mat('Emissive amber windows',(.95,.35,.042),rough=.36,emission=3)
flame_outer=mat('Fire amber shell',(1,.14,.004),rough=.32,emission=4)
flame_inner=mat('Fire golden core',(1,.62,.035),rough=.28,emission=7)
flame_hot=mat('Fire ivory tip',(1,.91,.42),rough=.28,emission=10)
moss=mat('Moss muted olive',(.07,.13,.065),rough=.94,noise=.5)
obsidian=mat('Dark coals',(.022,.012,.008),rough=.95)
red=mat('Faded oxblood banner',(.13,.025,.024),rough=.95)

def cube(name,loc,scale,material,bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=put(bpy.context.object,name,material);o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        b=o.modifiers.new('Editable worn edges','BEVEL');b.width=bevel;b.segments=2
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o

def cyl(name,loc,r,depth,material,vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc)
    o=put(bpy.context.object,name,material)
    b=o.modifiers.new('Edge wear','BEVEL');b.width=min(.028,r*.08);b.segments=2
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def sphere(name,loc,scale,material,sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc)
    o=put(bpy.context.object,name,material);o.scale=scale
    return o

def cone(name,loc,r1,r2,depth,material,vertices=8):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc)
    return put(bpy.context.object,name,material)

def bar(name,a,b,r,material):
    av,bv=Vector(a),Vector(b);d=bv-av
    o=cyl(name,(av+bv)/2,r,d.length,material,12)
    o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    return o

def ring(name,loc,major,minor,material):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=48,minor_segments=8,location=loc)
    return put(bpy.context.object,name,material)

def light(name,loc,color,energy,size=.3,kind='POINT',target=None):
    d=bpy.data.lights.new(name,kind);d.energy=energy;d.color=color
    if kind=='AREA':d.shape='DISK';d.size=size
    else:d.shadow_soft_size=size
    o=bpy.data.objects.new(name,d);COLS['07_Lights'].objects.link(o);o.location=loc
    if target:o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o

def arch(name,x,y,z,width,height,depth,material):
    # Pointed gothic window slab, extruded in Y; actual mesh, not a decal.
    hw=width/2
    profile=[(-hw,0),(hw,0),(hw,height*.65),(hw*.7,height*.84),(0,height),(-hw*.7,height*.84),(-hw,height*.65)]
    verts=[(x+px,y+dy,z+pz) for dy in [-depth/2,depth/2] for px,pz in profile]
    n=len(profile);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name+' mesh');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);COLS[active].objects.link(o);mesh.materials.append(material)
    return o

def flame(name,loc,height,radius,phase):
    # Three layered volumetric tear-shaped meshes, keyed as a five-second loop.
    for layer,(scale,material) in enumerate([(1,flame_outer),(.62,flame_inner),(.32,flame_hot)]):
        verts=[];faces=[];segments=12;levels=9
        for j in range(levels):
            t=j/(levels-1);r=radius*scale*math.sin(math.pi*t)**.75+.003
            dx=math.sin(t*3.1+phase)*height*.09*t
            for k in range(segments):
                ang=k*2*math.pi/segments
                verts.append((math.cos(ang)*r+dx,math.sin(ang)*r,t*height*(1 if layer==0 else .78)))
        for j in range(levels-1):
            for k in range(segments):
                a=j*segments+k;b=j*segments+(k+1)%segments;faces.append((a,b,b+segments,a+segments))
        faces.append(tuple(range(segments-1,-1,-1)))
        mesh=bpy.data.meshes.new(name+f' layer {layer} mesh');mesh.from_pydata(verts,[],faces);mesh.update()
        o=bpy.data.objects.new(name+f' layer {layer}',mesh);COLS['05_AnimatedFire'].objects.link(o);o.location=loc;mesh.materials.append(material)
        for p in mesh.polygons:p.use_smooth=True
        first=None
        for frame in range(1,122,12):
            if frame==121:s=first
            else:s=(1+.14*math.sin(frame*.4+phase+layer),1+.1*math.cos(frame*.37+phase),1+.2*math.sin(frame*.35+phase))
            if first is None:first=s
            o.scale=s;o.rotation_euler[2]=.16*math.sin((frame-1)*2*math.pi/120+phase)
            o.keyframe_insert(data_path='scale',frame=frame);o.keyframe_insert(data_path='rotation_euler',frame=frame)
        o['role']='Animated 3D flame; not a sprite or background image'
    glow=light(name+' motivated light',(loc[0],loc[1],loc[2]+height*.45),(1,.34,.08),35*height,.15)
    start=None
    for frame in range(1,122,12):
        value=35*height*(.9+.2*math.sin(frame*.32+phase)) if frame<121 else start
        if start is None:start=value
        glow.data.energy=value;glow.data.keyframe_insert(data_path='energy',frame=frame)

cube('Walnut board body',(0,0,0),(15.7,9.8,.5),wood,.18)
cube('Lower iron rim',(0,0,-.22),(15.95,10.05,.15),iron,.09)
cube('Playing surface single quiet slab',(0,0,.3),(13.8,7.9,.18),slate,.13)
for y in [-4.15,4.15]:
    cube('Bronze long border',(0,y,.44),(14.5,.13,.15),bronze,.035)
    cube('Fine inner gold line',(0,y*.953,.405),(13.8,.035,.025),gold,.009)
for x in [-7.15,7.15]:
    cube('Bronze side border',(x,0,.44),(.13,8.3,.15),bronze,.035)
    for y in [-3.65,-2.2,0,2.2,3.65]:sphere('Border bronze rivet',(x,y,.53),(.065,.065,.035),gold,2)
cube('Central combat seam',(0,0,.399),(13.5,.026,.007),bronze,.004)
for x in [-7.12,7.12]:
    for y in [-4.12,4.12]:
        cone('Gothic corner crest',(x,y,.58),.27,.025,.26,gold,4)
        sphere('Corner jade inset',(x,y,.71),(.07,.07,.09),moss,2)
for y in [-2.4,2.4]:
    cyl('Empty avatar pedestal',(-8.35,y,.33),.74,.3,stone2,48)
    ring('Avatar bronze ring',(-8.35,y,.51),.61,.075,bronze)
    cyl('Avatar slate center',(-8.35,y,.51),.52,.035,slate,48)

active='06_Environment'
cube('Diorama rock foundation',(0,1,-.63),(19.5,15.8,.65),stone,.24)
for i in range(80):
    x=random.uniform(-9.4,9.4);y=random.choice([random.uniform(5.1,8.8),random.uniform(-6.8,-5.2)])
    if y>5.1 and abs(x)<5:continue
    sphere('Broken edge rock', (x,y,-.15), (random.uniform(.25,.7),random.uniform(.25,.7),random.uniform(.15,.42)),random.choice([stone,stone2,moss]),1)
for side in [-1,1]:
    x=side*8.8;y=3.7
    bar('Ancient bare trunk',(x,y,-.2),(x+side*.4,y,3.9),.16,wood)
    for j in range(7):
        z=1+j*.35
        end=(x+side*random.uniform(.5,1.4),y+random.uniform(-.8,.8),z+.6)
        bar('Angular dead branch',(x+side*.1,y,z),end,.055,wood)
        bar('Fine dead branch',end,(end[0]+side*.3,end[1]+.18,end[2]+.45),.018,wood)

active='02_Castle'
cube('Castle terrace',(0,6.8,.15),(15.8,4,.95),stone,.18)
cube('Cathedral nave',(0,7.1,2.1),(7.8,2.35,3.1),stone,.1)
cube('Nave roof ridge',(0,7.1,3.8),(7.9,2.45,.22),iron,.03)
for x in [-3.4,-2.3,-1.2,0,1.2,2.3,3.4]:
    cube('Cathedral buttress',(x,5.84,1.97),(.27,.58,3.8),stone2,.055)
    cone('Buttress pointed cap',(x,5.84,4.02),.22,.02,.42,iron,4)
for x in [-2.85,-1.75,-.6,.6,1.75,2.85]:
    arch('Recessed gothic window',x,5.897,1.68,.58,1.62,.08,iron)
    arch('Amber gothic window',x,5.84,1.74,.4,1.39,.025,amber)
    for dx in [-.10,.10]:cube('Window stone mullion',(x+dx,5.816,2.29),(.037,.045,1.1),stone,.006)
    cube('Window horizontal tracery',(x,5.81,2.45),(.38,.045,.035),stone,.006)
arch('Central door recess',0,5.46,.69,1.18,1.95,.15,iron)
arch('Central portal light',0,5.36,.72,.92,1.7,.035,amber)
cube('Portal wooden door',(0,5.31,1.31),(.77,.09,1.22),wood,.035)
for x in [-.3,0,.3]:cube('Portal iron bands',(x,5.245,1.3),(.035,.025,1.15),bronze,.005)
for i in range(4):cube('Cathedral stair',(0,5.02-i*.27,.48-i*.1),(2.3+i*.23,.32,.18),stone2,.025)

def tower(x,y,height,radius):
    cyl('Stone tower shaft',(x,y,.65+height/2),radius,height,stone,8)
    for k in range(1,6):
        z=.65+k*height/6
        cyl('Tower masonry ring',(x,y,z),radius*1.025,.08,stone2,8)
    cyl('Tower roof cornice',(x,y,height+.68),radius*1.14,.16,bronze,8)
    cone('Tower steep spire',(x,y,height+1.49),radius*1.2,.025,1.65,iron,8)
    sphere('Spire bronze finial',(x,y,height+2.34),(.055,.055,.085),gold,2)
    for z in [1.15,height*.53+.5,height*.8+.5]:
        arch('Tower arrow slit',x,y-radius-.035,z,.25,.65,.03,iron)
        arch('Tower amber arrow slit',x,y-radius-.06,z+.045,.15,.51,.02,amber)
    for dx in [-radius*.5,radius*.5]:bar('Tower roof rib',(x+dx,y-.4,height+.7),(x,y,height+2.29),.026,bronze)

for x,y,h,r in [(-6.2,7.1,3.8,.78),(6.2,7.1,3.8,.78),(-4.5,7.45,5.1,.68),(4.5,7.45,5.1,.68),(-1.1,8.4,5.8,.53),(1.1,8.4,5.8,.53)]:tower(x,y,h,r)
for side in [-1,1]:
    for j in range(4):
        x=side*(4.05+j*.62)
        cube('Castle wing masonry',(x,6.7,1.52),(.7,1.8,1.75),stone,.06)
        cube('Castle crenellation',(x,5.9,2.61),(.4,.42,.44),stone2,.03)
for x in [-6.2,6.2]:
    bar('Banner iron mast',(x,5.75,.65),(x,5.75,3.3),.035,iron)
    cloth=cube('Oxblood hanging banner',(x+.28,5.74,2.49),(.52,.045,1.18),red,.015)
    for f in [1,31,61,91,121]:
        cloth.rotation_euler[2]=.025*math.sin((f-1)*math.pi/60)
        cloth.keyframe_insert(data_path='rotation_euler',frame=f)
for i in range(40):
    x=random.uniform(-3.9,3.9);z=random.uniform(.7,3.45)
    # Low-relief stone chips add real depth along otherwise quiet walls.
    if min(abs(x-v) for v in [-2.85,-1.75,-.6,.6,1.75,2.85])<.28:continue
    cube('Wall chipped stone facing',(x,5.906,z),(random.uniform(.16,.36),.035,.12),stone2,.02)
light('Cathedral warm interior',(0,5.3,2.2),(1,.44,.14),230,.8)

active='03_Candles'
for group,(cx,cy) in enumerate([(-8.22,-.5),(8.22,-2.55),(8.18,2.4),(-8.18,4.15)]):
    cyl('Candle cluster bronze tray',(cx,cy,.41),.48,.12,bronze,32)
    for j,(dx,dy,h,r) in enumerate([(-.2,-.1,.67,.105),(.13,.07,.94,.13),(.23,-.18,.38,.10)]):
        x,y,z=cx+dx,cy+dy,.5
        cyl(f'Candle {group}.{j} wax body',(x,y,z+h/2),r,h,wax,24)
        cyl('Candle wax rim',(x,y,z+h-.012),r*1.03,.035,wax,24)
        cyl('Dark wick',(x,y,z+h+.025),.012,.075,wick,8)
        for k in range(4):
            a=k*math.pi/2+random.random();drip=random.uniform(.04,.17)
            sphere('Wax drip',(x+math.cos(a)*r,y+math.sin(a)*r,z+h-drip/2),(.027,.025,drip),wax,2)
        flame(f'Candle {group}.{j} flame',(x,y,z+h+.045),.27,.055,group+j*.73)

active='04_Braziers'
for i,(x,y) in enumerate([(-8.3,-4.35),(8.3,4.2)]):
    cyl('Brazier stone plinth',(x,y,.22),.6,.4,stone2,8)
    cyl('Brazier bronze stem',(x,y,.74),.15,.7,bronze,16)
    cone('Brazier bronze bowl',(x,y,1.13),.28,.6,.37,bronze,24)
    ring('Brazier upper lip',(x,y,1.325),.56,.06,gold)
    cyl('Brazier coal bed',(x,y,1.3),.48,.05,obsidian,24)
    for k in range(8):
        a=k*math.pi/4
        bar('Brazier claw',(x+math.cos(a)*.5,y+math.sin(a)*.5,1.27),(x+math.cos(a)*.56,y+math.sin(a)*.56,1.68),.035,iron)
        sphere('Irregular coal',(x+random.uniform(-.27,.27),y+random.uniform(-.27,.27),1.35),(.12,.1,.075),obsidian,1)
    for j in range(5):flame(f'Brazier {i} fire {j}',(x+random.uniform(-.24,.24),y+random.uniform(-.24,.24),1.36),random.uniform(.65,1),.13,i+j*.53)
    for k in range(12):
        spark=sphere(f'Brazier {i} ember {k}',(x,y,1.4),(.016,.016,.016),flame_inner,1)
        # Same start/end pose; each spark rises and disappears before wrapping.
        dx,dy=random.uniform(-.65,.65),random.uniform(-.6,.6)
        for f,t in [(1,0),(31,.25),(61,.5),(91,.75),(119,1),(120,1),(121,0)]:
            spark.location=(x+dx*t,y+dy*t,1.5+1.9*t)
            spark.scale=(.017*(1-t),)*3
            spark.keyframe_insert(data_path='location',frame=f);spark.keyframe_insert(data_path='scale',frame=f)

active='07_Lights'
light('Cold moon key',(-7,4,14),(.38,.61,1),1800,9,'AREA',(0,2,0))
light('Warm player fill',(2,-7,8),(1,.64,.32),1500,8,'AREA',(0,0,0))
light('Architecture rim',(0,10,10),(.38,.7,1),1200,6,'AREA',(0,6,2))

active='08_Cameras'
d=bpy.data.cameras.new('Delivery camera');cam=bpy.data.objects.new('Delivery camera',d);COLS[active].objects.link(cam)
cam.location=(11,-17,21)
cam.rotation_euler=(Vector((0,1.5,1))-cam.location).to_track_quat('-Z','Y').to_euler()
d.type='ORTHO';d.ortho_scale=27
scene.camera=cam
scene.frame_set(1)
scene['Project']='Eruldin: Yankilar — original editable 3D board art slice'
scene['Not final']='No Riot assets. Stylized first model pass; no fluid simulation, rigged characters or production optimization.'
scene['Animation']='24fps, frames 1-120, 5 second cycle. 3D flame scales, rotation, point light flicker, ember transforms, banner motion.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'eruldin-korvengrad-board-v1.blend'))
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(ROOT/'previews/board-camera-frame001.png')
bpy.ops.render.render(write_still=True)
summary={'blender':bpy.app.version_string,'objects':len(scene.objects),'meshes':sum(o.type=='MESH' for o in scene.objects),'lights':sum(o.type=='LIGHT' for o in scene.objects),'animated_objects':sum(bool(o.animation_data) for o in scene.objects),'animated_light_data':sum(o.type=='LIGHT' and bool(o.data.animation_data) for o in scene.objects),'materials':len(bpy.data.materials),'fps':24,'frame_start':1,'frame_end':120,'render_engine':scene.render.engine,'render_size':[1600,1000],'collections':{c.name:len(c.objects) for c in COLS.values()},'limitations':['First stylized model pass, not LoR final quality','Procedural bump nodes are Blender-specific; GLB material appearance is simpler','No volumetric fluid fire/smoke simulation','No render performance benchmark or final topology/LOD pass']}
(ROOT/'scene-inventory.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print('ERULDIN_SCENE_SAVED',json.dumps(summary))
